import { Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, MeshPhysicalMaterial, MeshBasicMaterial, BoxGeometry, OctahedronGeometry, TorusGeometry, SphereGeometry, TubeGeometry, CatmullRomCurve3, Vector3, AmbientLight, DirectionalLight, ACESFilmicToneMapping } from 'three';

// A self-contained preview: removing the HTML figure and this mount restores the page.
export function mountConnectedScene() {
  const host = document.querySelector('[data-connected-scene]');
  if (!host) return () => {};
  const stage = host.querySelector('.connected-stage');
  const buttons = [...host.querySelectorAll('[data-flow-module]')];
  const renderer = new WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.domElement.setAttribute('aria-hidden','true');
  const scene = new Scene(), root = new Group();
  scene.add(root, new AmbientLight(0xffffff, 2.6));
  const light = new DirectionalLight(0xd5fff1, 4);
  light.position.set(-3,5,6); scene.add(light);
  const camera = new PerspectiveCamera(36,1,.1,30);
  camera.position.set(0,0,10); camera.lookAt(0,0,0);
  const colors = [0xa78bfa,0xf59e0b,0x38bdf8,0x10b981,0xfb7185,0x5eead4];
  const descriptions = [
    'Mijoz so‘rovi, mas’ul xodim va keyingi aloqa bir joyda kuzatiladi.',
    'Xomashyo sarfi va tayyor mahsulot kirimi ombor hisobi bilan bog‘lanadi.',
    'Bajarilgan ish, davomat va xodimning ish haqi birga kuzatiladi.',
    'Mahsulot kirimi va chiqimi qayd etilganda ombor qoldig‘i yangilanadi.',
    'Guruh, dars, davomat va o‘quvchi to‘lovi bir hisobda yuritiladi.',
    'Kassadagi savdo ombor qoldig‘i va to‘lov hisobiga bog‘lanadi.',
  ];
  const geometry = new BoxGeometry(.43,.43,.43);
  const dotGeometry = new SphereGeometry(.035,8,6);
  const core = new Group(); root.add(core);
  const coreMaterial = new MeshPhysicalMaterial({color:colors[5],metalness:.55,roughness:.18,clearcoat:1});
  core.add(new Mesh(new OctahedronGeometry(.42),coreMaterial));
  const shell = new Mesh(new OctahedronGeometry(.65),new MeshBasicMaterial({color:0x6ee7b7,wireframe:true,transparent:true,opacity:.3}));
  core.add(shell);
  const rings = [0,1].map(i=>{
    const ring = new Mesh(new TorusGeometry(.85+i*.13,.009,6,96),new MeshBasicMaterial({color:0x34d399,transparent:true,opacity:.4}));
    ring.rotation.set(.55+i*.9,.25+i*.6,.2); core.add(ring); return ring;
  });
  const nodes = buttons.map((button,i)=>{
    const angle = Math.PI*.84-i*Math.PI/3;
    const position = new Vector3(Math.cos(angle)*2.85,Math.sin(angle)*1.6,Math.sin(angle*2)*.3);
    const group = new Group(); group.position.copy(position); root.add(group);
    const material = new MeshPhysicalMaterial({color:colors[i],metalness:.3,roughness:.25,clearcoat:1,emissive:colors[i],emissiveIntensity:.1});
    const cube = new Mesh(geometry,material); cube.rotation.set(.4,.6,.25); group.add(cube);
    const halo = new Mesh(new TorusGeometry(.38,.008,6,48),new MeshBasicMaterial({color:colors[i],transparent:true,opacity:.45}));
    halo.rotation.x=.65; group.add(halo);
    const curve = new CatmullRomCurve3([new Vector3(),new Vector3(position.x*.3,position.y*.18,.8),new Vector3(position.x*.72,position.y*.8,.45),position]);
    const routeMaterial = new MeshBasicMaterial({color:colors[i],transparent:true,opacity:.24});
    const route = new Mesh(new TubeGeometry(curve,40,.007,5,false),routeMaterial); root.add(route);
    const packets = Array.from({length:3},()=>{
      const dot = new Mesh(dotGeometry,new MeshBasicMaterial({color:colors[i],transparent:true,opacity:.85}));
      root.add(dot); return dot;
    });
    return {button,position,group,cube,halo,curve,routeMaterial,material,packets};
  });
  // An outer circuit makes the relationships visible between departments too.
  const circuit = new CatmullRomCurve3(nodes.map(node=>node.position),true,'catmullrom',.45);
  root.add(new Mesh(new TubeGeometry(circuit,160,.005,4,true),new MeshBasicMaterial({color:0x34d399,transparent:true,opacity:.15})));
  const satellites = Array.from({length:4},()=>{
    const dot = new Mesh(dotGeometry,new MeshBasicMaterial({color:0x6ee7b7}));root.add(dot);return dot;
  });
  let width=1,height=1,visible=false,dead=false,available=true,elapsed=0,last=0,selected=5;
  let targetX=0,targetY=0;
  const projected = new Vector3();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const render = () => {
    if(dead || !available)return;
    root.rotation.y += (targetX*.15-root.rotation.y)*.08;
    root.rotation.x += (targetY*.06-root.rotation.x)*.08;
    core.rotation.set(elapsed*.17,elapsed*.24,.1);
    shell.rotation.z=-elapsed*.18;
    rings.forEach((ring,i)=>{ring.rotation.y=elapsed*(i?-.25:.2)+i*.6;});
    nodes.forEach((node,i)=>{
      const active=i===selected;
      node.cube.rotation.y=elapsed*.25+i;
      node.cube.rotation.z=.25+Math.sin(elapsed*.6+i)*.08;
      node.group.scale.setScalar((active?1.2:1)+Math.sin(elapsed*1.4+i)*.025);
      node.halo.rotation.z=elapsed*.3;
      node.material.emissiveIntensity=active?.45:.08;
      node.routeMaterial.opacity=active?.75:.18;
      node.packets.forEach((packet,j)=>{
        node.curve.getPoint((elapsed*.14+j/3+i*.11)%1,packet.position);
        packet.scale.setScalar(active?1.5:.8);
      });
      node.group.getWorldPosition(projected);projected.project(camera);
      node.button.style.setProperty('--node-x',`${(projected.x*.5+.5)*width}px`);
      node.button.style.setProperty('--node-y',`${(-projected.y*.5+.5)*height+(node.position.y>.95?-62:34)}px`);
    });
    satellites.forEach((dot,i)=>circuit.getPoint((elapsed*.045+i/4)%1,dot.position));
    renderer.render(scene,camera);
  };
  const frame = time => {
    if(time-last<33)return;
    elapsed+=Math.min((time-last)/1000,.05);last=time;render();
  };
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
    camera.position.z=Math.max(8.8,3.8/(Math.tan(Math.PI/10)*camera.aspect));
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
  const theme = () => {light.intensity=document.documentElement.dataset.theme==='dark'?4:2.8;render();};
  const lost = event => {event.preventDefault();available=false;host.classList.remove('is-connected');buttons.forEach(button=>button.disabled=true);sync();};
  const restored = () => {available=true;host.classList.add('is-connected');buttons.forEach(button=>button.disabled=false);resize();sync();};
  const observer = new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});observer.observe(host);
  const sizeObserver = new ResizeObserver(resize);sizeObserver.observe(stage);
  const themeObserver = new MutationObserver(theme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  stage.prepend(renderer.domElement);host.classList.add('is-connected');resize();theme();
  buttons.forEach(button=>button.disabled=false);
  host.addEventListener('click',select);stage.addEventListener('pointermove',pointer);stage.addEventListener('pointerleave',leave);
  document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
  renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);
  return () => {
    dead=true;renderer.setAnimationLoop(null);observer.disconnect();sizeObserver.disconnect();themeObserver.disconnect();
    host.removeEventListener('click',select);stage.removeEventListener('pointermove',pointer);stage.removeEventListener('pointerleave',leave);
    document.removeEventListener('visibilitychange',sync);motion.removeEventListener('change',sync);
    renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);
    const geometries=new Set(),materials=new Set();
    scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)materials.add(object.material);});
    geometries.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());renderer.dispose();renderer.domElement.remove();host.classList.remove('is-connected');buttons.forEach(button=>button.disabled=true);
  };
}
