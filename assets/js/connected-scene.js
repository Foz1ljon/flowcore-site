import { Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, MeshPhysicalMaterial, MeshBasicMaterial, CylinderGeometry, CapsuleGeometry, TorusGeometry, SphereGeometry, TubeGeometry, CatmullRomCurve3, Vector3, AmbientLight, DirectionalLight, ACESFilmicToneMapping, PMREMGenerator, PCFSoftShadowMap } from 'three';

import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Deterministic poses keep forward/reverse scroll identical at every progress value.
const easeAssembly=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
const assemblySockets=[[-.24,.29,.12],[.05,.29,.12],[-.24,.05,.12],[-.24,-.24,.12],[.05,.05,.12],[.31,-.3,.12],[.28,.29,.12]];
export function assemblyPose(progress,index,start) {
  const travel=easeAssembly((progress-.08-index*.009)/.64);
  const target=assemblySockets[index];
  const control=[start[0]*.2-start[1]*.38,start[1]*.2+start[0]*.22,.65+index*.035];
  const position=start.map((value,axis)=>(1-travel)**2*value+2*(1-travel)*travel*control[axis]+travel**2*target[axis]);
  const dissolve=easeAssembly((progress-.55-index*.009)/.22);
  return {position,travel,opacity:1-dissolve,scale:1-.72*travel};
}

// A self-contained preview: removing the HTML figure and this mount restores the page.
export function mountConnectedScene() {
  const host = document.querySelector('[data-connected-scene]');
  if (!host) return () => {};
  const stage = host.querySelector('.connected-stage');
  const intro = host.closest('[data-assembly-intro]');
  const clamp = value => Math.max(0,Math.min(1,value));
  const smooth = value => {const t=clamp(value);return t*t*(3-2*t);};
  const buttons = [...host.querySelectorAll('[data-flow-module]')];
  const renderer = new WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');
  const scene = new Scene(), root = new Group();
  scene.add(root, new AmbientLight(0xffffff, .65));
  const environment = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  const environmentMap = pmrem.fromScene(environment, .04);
  scene.environment = environmentMap.texture;
  environment.dispose(); pmrem.dispose();
  const fill = new DirectionalLight(0xc6ddff, 1.6);
  fill.position.set(4, 2, -3); scene.add(fill);
  const light = new DirectionalLight(0xd5fff1, 4);
  light.position.set(-3,5,6); light.castShadow=true;
  light.shadow.mapSize.set(1024,1024);
  Object.assign(light.shadow.camera,{left:-5,right:5,top:4,bottom:-4,near:.1,far:20});
  light.shadow.normalBias=.025; light.shadow.bias=-.0002; scene.add(light);
  const camera = new PerspectiveCamera(36,1,.1,30);
  camera.position.set(0,0,10); camera.lookAt(0,0,0);
  const colors = [0xa78bfa,0xf59e0b,0x38bdf8,0x10b981,0xfb7185,0x5eead4,0xe5b14e];
  const descriptions = [
    'Mijoz so‘rovi, mas’ul xodim va keyingi aloqa bir joyda kuzatiladi.',
    'Xomashyo sarfi va tayyor mahsulot kirimi ombor hisobi bilan bog‘lanadi.',
    'Bajarilgan ish, davomat va xodimning ish haqi birga kuzatiladi.',
    'Mahsulot kirimi va chiqimi qayd etilganda ombor qoldig‘i yangilanadi.',
    'Guruh, dars, davomat va o‘quvchi to‘lovi bir hisobda yuritiladi.',
    'Kassadagi savdo ombor qoldig‘i va to‘lov hisobiga bog‘lanadi.',
    'Moliya hisoblar, kirim va chiqimlarni bir joyda ko‘rsatadi. POS, ta’lim va ish haqi to‘lovlarini tanlangan hisobga ulash mumkin.',
  ];
  const dotGeometry = new SphereGeometry(.025,10,8);
  const core = new Group(); root.add(core);
  const coreMaterial = new MeshPhysicalMaterial({color:colors[5],metalness:.35,roughness:.3,clearcoat:1});
  const rings = [0,1].map(i=>{
    const ring = new Mesh(new TorusGeometry(.79+i*.09,.012,8,96),coreMaterial);
    ring.scale.y=.64; ring.position.z=-.2-i*.08; core.add(ring); return ring;
  });
  // Each department is a miniature product model, lit by the same studio environment.
  const material=(color,metalness=.05,roughness=.36)=>new MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.55,envMapIntensity:.7});
  const ivory=material(0xf5f5ed),ink=material(0x203c3b,.4),metal=material(0x9cb8b6,.75,.26),wood=material(0xc39b65);
  function miniature(id,accent) {
    const model=new Group(); model.rotation.set(.32,-.48,.03);
    const add=(geometry,mat,x=0,y=0,z=0,parent=model)=>{const part=new Mesh(geometry,mat);part.position.set(x,y,z);part.castShadow=true;part.receiveShadow=true;parent.add(part);return part;};
    const box=(w,h,d,mat,x=0,y=0,z=0,parent=model)=>add(new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.16),mat,x,y,z,parent);
    const base=add(new CylinderGeometry(.59,.63,.09,48),ivory,0,-.44);base.scale.z=.8;
    add(new CylinderGeometry(.61,.61,.025,48),metal,0,-.495).scale.z=.8;
    const parcel=(x,y,z,size=.3)=>{box(size,size,size,accent,x,y,z);box(size*.16,size+.004,size+.004,ivory,x,y,z);box(size*.5,.065,.008,ivory,x,y-.035,z+size/2+.004);};
    if(id==='wms') {
      for(let i=0;i<3;i++)box(.92,.045,.13,wood,0,-.36,-.25+i*.25);
      for(const x of [-.32,.32])box(.1,.08,.7,wood,x,-.4);
      parcel(-.21,-.15,.1,.34);parcel(.2,-.15,.1,.34);parcel(0,.19,.03,.34);
    } else if(id==='erp') {
      box(1.02,.13,.49,ink,0,-.13);
      for(const x of [-.39,.39])box(.075,.28,.35,metal,x,-.3);
      for(let i=0;i<7;i++){const roller=add(new CylinderGeometry(.055,.055,.5,16),metal,-.43+i*.143,-.065);roller.rotation.x=Math.PI/2;}
      parcel(-.22,.12,0,.25);parcel(.2,.12,0,.25);
      box(.08,.69,.09,accent,.45,.02,-.24);box(.43,.08,.09,accent,.28,.32,-.24);
      box(.09,.13,.09,ink,.1,.22,-.24);
    } else if(id==='hr') {
      [[-.33,-.07,0],[.33,-.07,0],[0,.08,.16]].forEach(([x,y,z],i)=>{
        add(new CapsuleGeometry(.12,.18,5,16),i===2?ink:accent,x,y-.12,z);
        add(new SphereGeometry(.115,24,16),ivory,x,y+.19,z);
        box(.055,.08,.014,metal,x,y-.09,z+.12);
      });
    } else if(id==='crm') {
      const bubble=(x,y,z,mat)=>{
        box(.64,.4,.13,mat,x,y,z);
        const tail=box(.13,.15,.1,mat,x-.18,y-.19,z);tail.rotation.z=-.5;
        for(let i=0;i<3;i++)add(new SphereGeometry(.032,16,12),ivory,x-.14+i*.14,y,z+.08);
      };
      bubble(-.15,.17,-.06,accent);bubble(.17,-.17,.15,ink);
    } else if(id==='lms') {
      const book=new Group();model.add(book);book.rotation.set(.1,0,.03);book.position.y=-.08;
      for(const side of [-1,1]){
        const leaf=new Group();leaf.rotation.z=side*.14;book.add(leaf);
        box(.45,.065,.65,accent,side*.235,0,0,leaf);
        box(.42,.095,.6,ivory,side*.22,.075,0,leaf);
        for(let i=0;i<5;i++)box(.28,.006,.012,metal,side*.23,.125,-.19+i*.085,leaf);
      }
      box(.045,.06,.67,ink,0,.025,0,book);
      box(.055,.008,.31,accent,.31,.13,.19,book);
    } else if(id==='finance') {
      box(.46,.62,.075,ink,-.16,.02,-.08);
      box(.38,.52,.012,ivory,-.16,.02,-.035);
      for(let i=0;i<3;i++)box(.06,.12+i*.07,.018,accent,-.28+i*.11,-.09+i*.035,-.02);
      for(const [x,z,count] of [[.2,.14,4],[.4,-.03,6]]){
        for(let i=0;i<count;i++)add(new CylinderGeometry(.13,.13,.055,32),accent,x,-.34+i*.058,z);
      }
    } else if(id==='pos') {
      box(.67,.12,.52,ink,0,-.29,.07);
      box(.11,.34,.1,metal,0,-.06,-.1);
      const screen=box(.69,.44,.095,ink,0,.21,-.08);screen.rotation.x=-.16;
      const display=box(.59,.34,.012,accent,0,.21,-.018);display.rotation.x=-.16;
      for(let i=0;i<3;i++)box(.22-i*.035,.019,.014,ivory,-.1,.29-i*.07,.005);
      box(.09,.09,.016,ivory,.18,.16,.015);
      box(.3,.16,.3,metal,.33,-.17,.24);
      box(.21,.22,.015,ivory,.33,-.02,.26);
      for(let i=0;i<3;i++)box(.14,.012,.006,ink,.33,.03-i*.045,.271);
    }
    return model;
  }
  const nodes = buttons.map((button,i)=>{
    const scattered=[[-2.55,1.2,-.25],[-.55,1.65,.15],[2.25,1.2,-.25],[2.65,-.8,.15],[.75,-1.55,-.1],[-1.25,-1.45,.25],[-2.65,-.4,-.15]];
    const position = new Vector3(...scattered[i]);
    const group = new Group(); group.position.copy(position); root.add(group);
    const material = new MeshPhysicalMaterial({color:colors[i],metalness:.3,roughness:.25,clearcoat:1,emissive:colors[i],emissiveIntensity:.1});
    const cube = miniature(button.dataset.flowModule,material); group.add(cube);
    const halo = new Mesh(new TorusGeometry(.67,.009,8,64),new MeshBasicMaterial({color:colors[i],transparent:true,opacity:.45}));
    halo.rotation.x=Math.PI/2; halo.position.y=-.5; group.add(halo);
    const curve = new CatmullRomCurve3([new Vector3(),new Vector3(position.x*.3,position.y*.18,.8),new Vector3(position.x*.72,position.y*.8,.45),position]);
    const routeMaterial = new MeshBasicMaterial({color:colors[i],transparent:true,opacity:.24});
    const route = new Mesh(new TubeGeometry(curve,40,.007,5,false),routeMaterial); root.add(route);
    const packets = Array.from({length:3},()=>{
      const dot = new Mesh(dotGeometry,new MeshBasicMaterial({color:colors[i],transparent:true,opacity:.85}));
      root.add(dot); return dot;
    });
    return {button,position,group,cube,halo,curve,routeMaterial,material,packets};
  });
  let fitDistance=10;
  let width=1,height=1,visible=false,dead=false,available=true,elapsed=0,last=0,selected=5;
  let targetX=0,targetY=0,progress=Number(intro?.dataset.assemblyProgress)||0;
  const projected = new Vector3();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const render = () => {
    if(dead || !available)return;
    const merge=smooth((progress-.1)/.68);
    const reveal=smooth((progress-.58)/.28);
    camera.position.z=fitDistance*(1-reveal*.13);camera.updateMatrixWorld();
    root.rotation.y += (targetX*.15*(1-merge)-root.rotation.y)*.08;
    root.rotation.x += (targetY*.06*(1-merge)-root.rotation.x)*.08;
    core.rotation.z=Math.sin(elapsed*.2)*.025;
    core.scale.setScalar(.6+merge*.75);
    core.visible=merge>.02&&reveal<.995;
    coreMaterial.transparent=true;coreMaterial.opacity=Math.sin(merge*Math.PI)*(1-reveal)*.35;
    // The final mark is the original inline SVG, untouched by lighting or perspective.
    root.position.y=smooth((progress-.64)/.23)*.2*Math.tan(Math.PI/10)*camera.position.z;
    const modelOpacity=1-smooth((progress-.59)/.23);
    for(const mat of [ivory,ink,metal,wood]){mat.transparent=true;mat.opacity=modelOpacity;mat.depthWrite=modelOpacity>.95;}
    rings.forEach((ring,i)=>{ring.rotation.z=elapsed*(i?-.06:.06);});
    nodes.forEach((node,i)=>{
      const active=i===selected;
      const pose=assemblyPose(progress,i,node.position.toArray());
      node.group.position.fromArray(pose.position);
      node.cube.rotation.y=-.48+Math.sin(elapsed*.4+i)*.07*(1-pose.travel)+Math.sin(pose.travel*Math.PI)*.3*(i%2?1:-1);
      node.cube.rotation.z=Math.sin(pose.travel*Math.PI)*.1*(i%2?1:-1);
      node.cube.position.y=Math.sin(elapsed*.7+i)*.025*(1-pose.travel);
      node.group.scale.setScalar((active?1.06:1)*1.4*pose.scale);
      node.group.visible=pose.opacity>.005;
      node.material.transparent=true;node.material.opacity=pose.opacity;node.material.depthWrite=pose.opacity>.95;
      node.halo.material.opacity=.32*(1-pose.travel);
      node.halo.rotation.z=elapsed*.3;
      node.material.emissiveIntensity=active?.08:.015;
      node.routeMaterial.opacity=(active?.32:.12)*(1-smooth((progress-.1)/.35));
      node.packets.forEach((packet,j)=>{
        node.curve.getPoint((elapsed*.14+j/3+i*.11)%1,packet.position);
        packet.scale.setScalar((active?1.15:.7)*(1-smooth((progress-.16)/.38)));
      });
      node.group.getWorldPosition(projected);projected.project(camera);
      node.button.style.setProperty('--node-x',`${(projected.x*.5+.5)*width}px`);
      node.button.style.setProperty('--node-y',`${(-projected.y*.5+.5)*height+(node.position.y>0?-102:74)}px`);
    });
    renderer.render(scene,camera);
  };
  const frame = time => {
    if(time-last<33)return;
    elapsed+=Math.min((time-last)/1000,.05);last=time;render();
  };
  const onAssembly = event => {progress=event.detail.progress;render();};
  const sync = () => {
    if(dead)return;
    renderer.setAnimationLoop(visible && !document.hidden && !motion.matches && available ? frame : null);
    render();
  };
  const resize = () => {
    ({width,height}=stage.getBoundingClientRect());
    if(!width || !height)return;
    renderer.setSize(width,height,false);camera.aspect=width/height;
    // Fit the complete circuit, leaving enough room for the HTML labels.
    fitDistance=Math.max(8.8,3.8/(Math.tan(Math.PI/10)*camera.aspect));camera.position.z=fitDistance;
    camera.updateProjectionMatrix();camera.updateMatrixWorld();render();
  };
  const select = event => {
    const button=event.target.closest('[data-flow-module]');
    if(!button)return;
    selected=buttons.indexOf(button);
    buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    coreMaterial.color.setHex(colors[selected]);coreMaterial.emissive.setHex(colors[selected]);coreMaterial.emissiveIntensity=.12;
    host.querySelector('[data-flow-description]').textContent=descriptions[selected];
    render();
  };
  const pointer = event => {
    if(event.pointerType!=='mouse' || motion.matches)return;
    const bounds=stage.getBoundingClientRect();
    targetX=(event.clientX-bounds.left)/width-.5;targetY=(event.clientY-bounds.top)/height-.5;
  };
  const leave = () => {targetX=targetY=0;};
  const theme = () => {light.intensity=document.documentElement.dataset.theme==='dark'?3.6:3.1;render();};
  const lost = event => {event.preventDefault();available=false;host.classList.remove('is-connected');buttons.forEach(button=>button.disabled=true);sync();};
  const restored = () => {available=true;host.classList.add('is-connected');buttons.forEach(button=>button.disabled=false);resize();sync();};
  const observer = new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});observer.observe(host);
  const sizeObserver = new ResizeObserver(resize);sizeObserver.observe(stage);
  const themeObserver = new MutationObserver(theme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  stage.prepend(renderer.domElement);host.classList.add('is-connected');buttons.forEach(button=>button.style.removeProperty('scale'));resize();theme();
  intro?.addEventListener('flowcore:assembly',onAssembly);
  window.dispatchEvent(new Event('flowcore:layout'));
  buttons.forEach(button=>button.disabled=false);
  host.addEventListener('click',select);stage.addEventListener('pointermove',pointer);stage.addEventListener('pointerleave',leave);
  document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
  renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);
  return () => {
    dead=true;intro?.removeEventListener('flowcore:assembly',onAssembly);renderer.setAnimationLoop(null);observer.disconnect();sizeObserver.disconnect();themeObserver.disconnect();
    host.removeEventListener('click',select);stage.removeEventListener('pointermove',pointer);stage.removeEventListener('pointerleave',leave);
    document.removeEventListener('visibilitychange',sync);motion.removeEventListener('change',sync);
    renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);
    const geometries=new Set(),materials=new Set();
    scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)materials.add(object.material);});
    geometries.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());environmentMap.dispose();light.shadow.dispose();renderer.dispose();renderer.domElement.remove();host.classList.remove('is-connected');buttons.forEach(button=>button.disabled=true);
  };
}
