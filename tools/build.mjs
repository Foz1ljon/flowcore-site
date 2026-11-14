import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { transform, build } from 'esbuild';
import { generatePages } from './generate-pages.mjs';
import { updateHomeSeo } from './seo.mjs';
const entries = {style:'assets/css/style.css',product:'assets/css/product.css',main:'assets/js/main.js',tour:'assets/js/tour.js',site:'assets/js/site.js',stack:'assets/js/stack-scroll.js'};
const assets = {};
const report = {};
mkdirSync('assets/dist',{recursive:true});
for (const [name,source] of Object.entries(entries)) {
  const loader = source.endsWith('.css') ? 'css' : 'js';
  const input = readFileSync(source,'utf8');
  const transformed = name === 'tour' ? await build({entryPoints:[source],bundle:true,write:false,format:'esm',minify:true,legalComments:'none',target:'es2020'}) : await transform(input,{loader,minify:true,legalComments:'none',target:loader==='css'?['chrome100','safari16.4','firefox115']:['es2020']});
  const {warnings} = transformed;
  const code = name === 'tour' ? transformed.outputFiles[0].text : transformed.code;
  if (warnings.length) throw new Error(JSON.stringify(warnings));
  const hash = createHash('sha256').update(code).digest('hex').slice(0,12);
  const output = `assets/dist/${name}.${hash}.${loader}`;
  writeFileSync(output,code);assets[name]=output;
  report[name]={source,output,before:Buffer.byteLength(input),after:Buffer.byteLength(code),gzip:gzipSync(code,{level:9}).length};
}
// Both optional 3D entries share Three.js and addons; visitors download the engine once.
const sceneSources={scene:'assets/js/flow-scene.js',factory:'assets/js/factory-scene.js'};
const sceneBuild=await build({entryPoints:sceneSources,bundle:true,splitting:true,write:false,outdir:'assets/dist',format:'esm',minify:true,legalComments:'eof',target:'es2020'});
const outputs=new Map(sceneBuild.outputFiles.map(file=>[file.path.split('/').pop(),file.text]));
const finalized=new Map(),visiting=new Set();
function saveSceneChunk(name){
  if(finalized.has(name))return finalized.get(name);
  if(visiting.has(name))throw new Error(`Circular 3D chunk dependency: ${name}`);
  visiting.add(name);
  const code=outputs.get(name).replace(/(["'])\.\/([^"']+\.js)\1/g,(_match,quote,dependency)=>`${quote}./${saveSceneChunk(dependency).filename}${quote}`);
  const hash=createHash('sha256').update(code).digest('hex').slice(0,12);
  const label=name==='scene.js'?'scene':name==='factory.js'?'factory':`three-${name.replace(/\.js$/,'').toLowerCase()}`;
  const filename=`${label}.${hash}.js`,output=`assets/dist/${filename}`;
  writeFileSync(output,code);
  const result={filename,output,code};finalized.set(name,result);visiting.delete(name);return result;
}
for(const [name,source] of Object.entries(sceneSources)){
  const result=saveSceneChunk(`${name}.js`);assets[name]=result.output;
  report[name]={source,output:result.output,before:Buffer.byteLength(readFileSync(source)),after:Buffer.byteLength(result.code),gzip:gzipSync(result.code,{level:9}).length};
}
let sharedIndex=0;
for(const [name,result] of finalized){
  if(name==='scene.js'||name==='factory.js')continue;
  const key=`threeShared${sharedIndex++}`;assets[key]=result.output;
  report[key]={source:'Shared Three.js engine and addons',output:result.output,before:Buffer.byteLength(result.code),after:Buffer.byteLength(result.code),gzip:gzipSync(result.code,{level:9}).length};
}
const experienceSource = 'assets/js/experience.js';
const experienceBuild = await build({entryPoints:[experienceSource],bundle:true,write:false,format:'esm',minify:true,legalComments:'eof',target:'es2020'});
const experienceCode = experienceBuild.outputFiles[0].contents;
const experienceHash = createHash('sha256').update(experienceCode).digest('hex').slice(0,12);
assets.experience = `assets/dist/experience.${experienceHash}.js`;
writeFileSync(assets.experience,experienceCode);
report.experience = {source:experienceSource,output:assets.experience,before:Buffer.byteLength(readFileSync(experienceSource)),after:experienceCode.length,gzip:gzipSync(experienceCode,{level:9}).length};
const previousHome=readFileSync('index.html','utf8');
let home=previousHome;
home=home.replace(/assets\/(?:js\/factory-scene|dist\/factory\.[a-f0-9]+)\.js/g,assets.factory);
home=home.replace(/assets\/(?:js\/flow-scene|dist\/scene\.[a-f0-9]+)\.js/g,assets.scene);
home=home.replace(/assets\/(?:js\/experience|dist\/experience\.[a-f0-9]+)\.js/g,assets.experience);
home=updateHomeSeo(home);
for (const name of ['style','main','tour','stack']) {
  const source=entries[name].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const regex=new RegExp(`(?:${source}(?:\\?v=[a-f0-9]+)?|assets/dist/${name}\\.[a-f0-9]+\\.(?:css|js))`,'g');
  home=home.replace(regex,assets[name]);
}
// Minify JSON-LD only; preserve meaningful HTML whitespace and readable source.
home=home.replace(/(<script type="application\/ld\+json">)\s*([\s\S]*?)\s*(<\/script>)/g,(_match,open,json,close)=>open+JSON.stringify(JSON.parse(json))+close);
writeFileSync('index.html',home);
const pages=generatePages(assets, previousHome);
writeFileSync('assets/manifest.json',JSON.stringify({assets,pages,errorPages:['404.html']},null,2)+'\n');
writeFileSync('tools/build-report.json',JSON.stringify(report,null,2)+'\n');
console.log(Object.entries(report).map(([name,r])=>`${name}: ${r.before} -> ${r.after} bytes (${r.gzip} gzip)`).join('\n'));
console.log(`Generated ${pages.length} product/legal pages and sitemap.xml`);
