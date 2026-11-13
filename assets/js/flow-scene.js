import { mountConnectedScene } from './connected-scene.js';
import { createFlowRibbons } from './flow-ribbons.js';
import { createModuleSymbols } from './module-symbols.js';
import { deviceQuality, createGovernor } from './quality.js';
import { Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, PlaneGeometry, ShaderMaterial, Color, ACESFilmicToneMapping } from 'three';

// Decorative, floating background; all product content stays in semantic HTML.
export function mountFlowScene(host) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const quality = deviceQuality();
  // Software WebGL (no GPU) keeps the CSS atmosphere and the HTML diagram.
  if (quality.software) return () => {};
  // The background is soft haze, translucent ribbons and points: it never needs more than 1.5x resolution.
  const renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
  const backgroundQuality = {...quality, pixelRatio: Math.min(quality.pixelRatio, 1.5), minPixelRatio: Math.min(quality.minPixelRatio, .6)};
  let hostWidth = 1, hostHeight = 1;
  const governor = createGovernor(backgroundQuality, ratio => { renderer.setPixelRatio(ratio); ribbons.pixelRatio(ratio); renderer.setSize(hostWidth, hostHeight, false); });
  renderer.setPixelRatio(governor.ratio);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  let connectedCleanup = null;
  try { connectedCleanup = mountConnectedScene(); } catch { /* Keep the HTML relationship diagram. */ }
  let moduleSymbols = null;
  try { moduleSymbols = createModuleSymbols(quality); } catch { /* SVG icons remain available. */ }
  const scene = new Scene();
  const camera = new PerspectiveCamera(35,1,.1,50);
  camera.position.set(0,0,10);
  const group = new Group(); scene.add(group);
    const ribbons = createFlowRibbons(group, quality);
  ribbons.pixelRatio(governor.ratio);
  const uniforms={uTime:{value:0},uDark:{value:0},uGlow:{value:new Color(0x4fc6a6)}};
  // A soft light field, independent of the particle geometry, uses two triangles.
  const hazeMaterial=new ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,depthTest:false,toneMapped:false,
    vertexShader:`varying vec2 vUv;
      void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
    fragmentShader:`uniform float uTime;uniform float uDark;uniform vec3 uGlow;varying vec2 vUv;
      void main(){
        vec2 p=vUv;
        vec2 a=vec2(.04+.06*sin(uTime*.11),.27+.14*cos(uTime*.08));
        vec2 b=vec2(.96+.04*cos(uTime*.09),.65+.15*sin(uTime*.07));
        float left=exp(-dot((p-a)*vec2(2.7,1.3),(p-a)*vec2(2.7,1.3))*3.0);
        float right=exp(-dot((p-b)*vec2(2.5,1.4),(p-b)*vec2(2.5,1.4))*3.0);
        float alpha=(left+right)*mix(.105,.17,uDark);
        gl_FragColor=vec4(uGlow,alpha);
        #include <colorspace_fragment>
      }`
  });
  const haze=new Mesh(new PlaneGeometry(2,2),hazeMaterial);haze.frustumCulled=false;haze.renderOrder=-10;scene.add(haze);
  const theme=()=>{
    const dark=document.documentElement.dataset.theme==='dark';
    uniforms.uDark.value=dark?1:0;
    ribbons.theme(dark);
    uniforms.uGlow.value.setHex(dark?0x13a783:0x4fc6a6);
  };
  const themeObserver=new MutationObserver(()=>{theme();render();});
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});theme();
  const place=time=>{uniforms.uTime.value=time+scrollY*.00008;ribbons.update(time,pointerX,pointerY,scrollY/Math.max(1,innerHeight));};
  let visible = false, paused = motion.matches, dead = false, contextAvailable = true, last = 0, elapsed = 0;
  let pointerX = 0, pointerY = 0;
  const area = document.documentElement;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const web = document.createElementNS(svgNamespace,'svg');
  web.classList.add('cursor-orbit'); web.setAttribute('aria-hidden','true');
  const make = (tag,css) => { const el=document.createElementNS(svgNamespace,tag); el.setAttribute('class',css); web.append(el); return el; };
  const halo = make('circle','network-halo'); halo.setAttribute('r','12');
  const hub = make('circle','network-hub'); hub.setAttribute('r','2');
  let active=false,dragging=false,grabbedPointer=null,seeded=false,overControl=false;
  let targetX=0,targetY=0,hubX=0,hubY=0,webOpacity=0;
  document.body.append(web);
  const updateWeb = () => {
    const enabled=finePointer.matches && !paused && !motion.matches;
    webOpacity+=((active && enabled?1:0)-webOpacity)*.18;
    web.style.opacity=webOpacity.toFixed(3);
    if(webOpacity<.005) return;
    hubX+=(targetX-hubX)*.18; hubY+=(targetY-hubY)*.18;
    halo.setAttribute('cx',hubX.toFixed(1)); halo.setAttribute('cy',hubY.toFixed(1));
    halo.setAttribute('r',dragging?'8':overControl?'20':'12');
    hub.setAttribute('cx',targetX.toFixed(1)); hub.setAttribute('cy',targetY.toFixed(1));
  };
  const render = () => {
    if(contextAvailable && !dead) { renderer.render(scene,camera); moduleSymbols?.render(elapsed,!paused && !motion.matches); }
  };
  const frame = time => {
    const budget = quality.idleFrameMs, interval = time - last;
    if (interval < budget - 2) return;
    governor.sample(interval, budget);
    elapsed += Math.min(interval/1000,.05); last = time;
    place(elapsed);
    updateWeb();
    group.rotation.y += (pointerX*.06-group.rotation.y)*.035;
    group.rotation.x += (pointerY*.04-group.rotation.x)*.035;
    render();
  };
  const sync = () => {
    if (dead) return;
    if(paused || motion.matches || document.hidden || !visible || !contextAvailable) { web.style.opacity='0'; webOpacity=0; }
    renderer.setAnimationLoop(visible && !document.hidden && !paused && contextAvailable ? frame : null);
    render();
  };
  const resize = () => {
    const {width,height} = host.getBoundingClientRect();
    if (!width || !height || dead) return;
    active=false; dragging=false; grabbedPointer=null; seeded=false; webOpacity=0; web.style.opacity='0';
    hostWidth = width; hostHeight = height;
    renderer.setSize(width,height,false); camera.aspect = width/height; camera.updateProjectionMatrix();
    const halfHeight = Math.tan(35*Math.PI/360)*10, halfWidth=halfHeight*camera.aspect;
    ribbons.resize(halfWidth,halfHeight,width);
    place(elapsed); render();
  };
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }); visibility.observe(host);
  const preference = () => { paused = motion.matches; sync(); };
  const pointer = event => {
    if(event.pointerType!=='mouse' || !finePointer.matches || motion.matches || paused) return;
    const r=host.getBoundingClientRect();
    pointerX=(event.clientX-r.left)/r.width-.5; pointerY=(event.clientY-r.top)/r.height-.5;
    targetX=event.clientX; targetY=event.clientY;
    overControl=!!event.target.closest('a,button');
    if(!seeded || !active) { hubX=targetX; hubY=targetY; seeded=true; }
    active=true;
  };
  const resetPointer = () => { pointerX=pointerY=0; active=false; dragging=false; grabbedPointer=null; };
  const pointerDown = event => {
    // Preserve links, buttons, text selection, touch scrolling and the native cursor.
    if(event.pointerType!=='mouse' || event.button!==0 || event.target.closest('a,button,input,textarea,select,label') || motion.matches || paused) return;
    pointer(event); dragging=true; grabbedPointer=event.pointerId;
  };
  const pointerUp = event => { if(event.pointerId===grabbedPointer) { dragging=false; grabbedPointer=null; } };
  const pointerPreference = () => { if(!finePointer.matches) { resetPointer(); web.style.opacity='0'; webOpacity=0; } };
  const contextLost = event => { event.preventDefault(); contextAvailable=false; renderer.setAnimationLoop(null); host.classList.remove('is-ready'); web.style.opacity='0'; };
  const contextRestored = () => { contextAvailable=true; host.classList.add('is-ready'); resize(); sync(); };
  const pageHide = event => { if (event.persisted) { renderer.setAnimationLoop(null); return; } cleanup(); };
  const cleanup = () => {
    dead=true; connectedCleanup?.(); moduleSymbols?.dispose(); renderer.setAnimationLoop(null); resizeObserver.disconnect(); visibility.disconnect(); themeObserver.disconnect();
    document.removeEventListener('visibilitychange',sync); motion.removeEventListener('change',preference);
    area.removeEventListener('pointerdown',pointerDown); window.removeEventListener('pointerup',pointerUp); window.removeEventListener('pointercancel',pointerUp);
    window.removeEventListener('blur',resetPointer); finePointer.removeEventListener('change',pointerPreference); web.remove();
    area.removeEventListener('pointermove',pointer); area.removeEventListener('pointerleave',resetPointer);
    window.removeEventListener('pagehide',pageHide); window.removeEventListener('pageshow',sync);
    renderer.domElement.removeEventListener('webglcontextlost',contextLost); renderer.domElement.removeEventListener('webglcontextrestored',contextRestored);
    const geometries=new Set(), materials=new Set();
    scene.traverse(object => { if(object.geometry) geometries.add(object.geometry); if(object.material) materials.add(object.material); });
    geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose()); renderer.dispose(); renderer.domElement.remove();
    host.classList.remove('is-ready');
  };
  area.addEventListener('pointerdown',pointerDown); window.addEventListener('pointerup',pointerUp); window.addEventListener('pointercancel',pointerUp);
  window.addEventListener('blur',resetPointer); finePointer.addEventListener('change',pointerPreference);
  motion.addEventListener('change',preference);
  document.addEventListener('visibilitychange',sync); area.addEventListener('pointermove',pointer); area.addEventListener('pointerleave',resetPointer);
  renderer.domElement.addEventListener('webglcontextlost',contextLost); renderer.domElement.addEventListener('webglcontextrestored',contextRestored);
  window.addEventListener('pagehide',pageHide); window.addEventListener('pageshow',sync);
  host.prepend(renderer.domElement); resize(); host.classList.add('is-ready'); sync();
  return cleanup;
}
