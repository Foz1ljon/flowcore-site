import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { transform } from 'esbuild';
import { generatePages } from './generate-pages.mjs';
import { updateHomeSeo } from './seo.mjs';
const entries = {style:'assets/css/style.css',product:'assets/css/product.css',main:'assets/js/main.js',tour:'assets/js/tour.js',site:'assets/js/site.js'};
const assets = {};
const report = {};
mkdirSync('assets/dist',{recursive:true});
for (const [name,source] of Object.entries(entries)) {
  const loader = source.endsWith('.css') ? 'css' : 'js';
  const input = readFileSync(source,'utf8');
  const {code,warnings} = await transform(input,{loader,minify:true,legalComments:'none',target:loader==='css'?['chrome100','safari16.4','firefox115']:['es2020']});
  if (warnings.length) throw new Error(JSON.stringify(warnings));
  const hash = createHash('sha256').update(code).digest('hex').slice(0,12);
  const output = `assets/dist/${name}.${hash}.${loader}`;
  writeFileSync(output,code);assets[name]=output;
  report[name]={source,output,before:Buffer.byteLength(input),after:Buffer.byteLength(code),gzip:gzipSync(code,{level:9}).length};
}
let home=readFileSync('index.html','utf8');
home=updateHomeSeo(home);
for (const name of ['style','main','tour']) {
  const source=entries[name].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const regex=new RegExp(`(?:${source}(?:\\?v=[a-f0-9]+)?|assets/dist/${name}\\.[a-f0-9]+\\.(?:css|js))`,'g');
  home=home.replace(regex,assets[name]);
}
// Minify JSON-LD only; preserve meaningful HTML whitespace and readable source.
home=home.replace(/(<script type="application\/ld\+json">)\s*([\s\S]*?)\s*(<\/script>)/g,(_match,open,json,close)=>open+JSON.stringify(JSON.parse(json))+close);
writeFileSync('index.html',home);
const pages=generatePages(assets);
writeFileSync('assets/manifest.json',JSON.stringify({assets,pages,errorPages:['404.html']},null,2)+'\n');
writeFileSync('tools/build-report.json',JSON.stringify(report,null,2)+'\n');
console.log(Object.entries(report).map(([name,r])=>`${name}: ${r.before} -> ${r.after} bytes (${r.gzip} gzip)`).join('\n'));
console.log(`Generated ${pages.length} product/legal pages and sitemap.xml`);
