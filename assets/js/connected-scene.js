import { createTeamModel } from './team-model.js';
import { Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, InstancedMesh, Object3D, Matrix4, MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial, CylinderGeometry, TorusGeometry, SphereGeometry, IcosahedronGeometry, RingGeometry, TubeGeometry, CatmullRomCurve3, Vector3, Color, AmbientLight, DirectionalLight, ACESFilmicToneMapping, PMREMGenerator, PCFSoftShadowMap, Sprite, SpriteMaterial, CanvasTexture, SRGBColorSpace, Points, PointsMaterial, BufferGeometry, BufferAttribute, DoubleSide } from 'three';

import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { deviceQuality, createGovernor } from './quality.js';

// Deterministic poses keep forward/reverse scroll identical at every progress value.
const easeAssembly=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
const assemblySockets=[[-.24,.29,.12],[.05,.29,.12],[-.24,.05,.12],[-.24,-.24,.12],[.05,.05,.12],[.31,-.3,.12],[.28,.29,.12]];
export function assemblyPose(progress,index,start) {
  const travel=easeAssembly((progress-.08-index*.009)/.64);
  const target=assemblySockets[index];
  // Every module spirals the same way into its socket: radius shrinks while the angle turns.
  const radius=Math.hypot(start[0],start[1])*(1-travel)**1.15;
  const angle=Math.atan2(start[1],start[0])+travel*1.2*Math.PI;
  const lift=Math.sin(travel*Math.PI);
  const position=[
    radius*Math.cos(angle)+target[0]*travel,
    radius*Math.sin(angle)*(1-.16*lift)+target[1]*travel,
    start[2]*(1-travel)+target[2]*travel+lift*.9,
  ];
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
  const quality = deviceQuality();
  // Software rendering would stutter the whole page; the HTML diagram stays instead.
  const renderer = new WebGLRenderer({alpha:true, antialias:quality.antialias, powerPreference:quality.tier==='high'?'default':'low-power', failIfMajorPerformanceCaveat:true});
  const governor = createGovernor(quality, ratio=>{renderer.setPixelRatio(ratio);renderer.setSize(width,height,false);});
  renderer.setPixelRatio(governor.ratio);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = quality.shadows;
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
  light.position.set(-3,5,6); light.castShadow=quality.shadows;
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
  const trailGeometry = new SphereGeometry(.045,8,6);
  const placer = new Object3D(), hidden = new Matrix4().makeScale(0,0,0);
  const glowTexture = (()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
    const context=canvas.getContext('2d'),gradient=context.createRadialGradient(64,64,0,64,64,64);
    gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.22,'rgba(255,255,255,.6)');
    gradient.addColorStop(.55,'rgba(255,255,255,.14)');gradient.addColorStop(1,'rgba(255,255,255,0)');
    context.fillStyle=gradient;context.fillRect(0,0,128,128);
    const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;return texture;
  })();
  const brand=0x10b981;
  const core = new Group(); root.add(core);
  // Energy core: soft glow, a turning lattice and three gyroscope rings that tighten as modules arrive.
  const coreGlow = new Sprite(new SpriteMaterial({map:glowTexture,color:0x34d399,transparent:true,opacity:0,depthWrite:false}));
  core.add(coreGlow);
  const latticeMaterial = new MeshBasicMaterial({color:brand,wireframe:true,transparent:true,opacity:0,depthWrite:false});
  const lattice = new Mesh(new IcosahedronGeometry(1.05,1),latticeMaterial); core.add(lattice);
  const heartMaterial = new MeshBasicMaterial({color:0xd1fae5,transparent:true,opacity:0,depthWrite:false});
  const heart = new Mesh(new SphereGeometry(.16,24,16),heartMaterial); core.add(heart);
  const coreMaterial = new MeshBasicMaterial({color:colors[5],transparent:true,opacity:0,depthWrite:false});
  const rings = [0,1,2].map(i=>{
    const ring = new Mesh(new TorusGeometry(1.15+i*.2,.01,8,128),coreMaterial);
    core.add(ring); return ring;
  });
  // Completion shockwaves: one facing the viewer, one spreading across the floor plane.
  const waves = [0,1].map(i=>{
    const wave = new Mesh(new RingGeometry(.975,1,128),new MeshBasicMaterial({color:brand,transparent:true,opacity:0,side:DoubleSide,depthWrite:false}));
    wave.rotation.x=i?1.15:0; root.add(wave); return wave;
  });
  // Deterministic dust field: drawn into the core with the modules, then released as a burst.
  let seed=7;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const particleCount=quality.particles;
  const particleSeeds=Array.from({length:particleCount},()=>({
    radius:1.4+random()*4.2,angle:random()*Math.PI*2,z:(random()-.5)*2.4,
    pull:.62+random()*.38,speed:.4+random()*.8,phase:random()*Math.PI*2,
  }));
  const particlePositions=new Float32Array(particleCount*3),particleColors=new Float32Array(particleCount*3);
  const tint=new Color();
  particleSeeds.forEach((_,i)=>{tint.setHex(i%3?brand:colors[i%colors.length]);tint.toArray(particleColors,i*3);});
  const particleGeometry=new BufferGeometry();
  particleGeometry.setAttribute('position',new BufferAttribute(particlePositions,3));
  particleGeometry.setAttribute('color',new BufferAttribute(particleColors,3));
  const particleMaterial=new PointsMaterial({size:.15,map:glowTexture,vertexColors:true,transparent:true,opacity:.5,depthWrite:false,sizeAttenuation:true});
  const particles=new Points(particleGeometry,particleMaterial); root.add(particles);
  // Each department is a miniature product model, lit by the same studio environment.
  const material=(color,metalness=.05,roughness=.36)=>quality.physical?new MeshPhysicalMaterial({color,metalness,roughness,clearcoat:roughness<.6?.55:0,envMapIntensity:.7}):new MeshStandardMaterial({color,metalness,roughness,envMapIntensity:.8});
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
      const team = createTeamModel(material);
      team.scale.setScalar(.72);
      team.position.y = .04;
      model.add(team);
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
    return mergeByMaterial(model);
  }
  // Dozens of small parts become one draw call per material; transforms are baked into the vertices.
  function mergeByMaterial(model) {
    const rotation=model.rotation.clone();
    model.rotation.set(0,0,0);model.updateMatrixWorld(true);
    const groups=new Map(),parts=[];
    model.traverse(object=>{if(object.isMesh)parts.push(object);});
    const indexed=parts.every(part=>part.geometry.index);
    for(const part of parts){
      let geometry=part.geometry.clone().applyMatrix4(part.matrixWorld);
      if(!indexed&&geometry.index)geometry=geometry.toNonIndexed();
      for(const name of Object.keys(geometry.attributes))if(!['position','normal','uv'].includes(name))geometry.deleteAttribute(name);
      if(!groups.has(part.material))groups.set(part.material,[]);
      groups.get(part.material).push(geometry);
    }
    const merged=new Group();
    for(const [mat,geometries] of groups){
      const geometry=mergeGeometries(geometries,false);
      geometries.forEach(item=>item.dispose());
      if(!geometry){model.rotation.copy(rotation);return model;}
      const mesh=new Mesh(geometry,mat);mesh.castShadow=quality.shadows;mesh.receiveShadow=quality.shadows;merged.add(mesh);
    }
    parts.forEach(part=>part.geometry.dispose());
    merged.rotation.copy(rotation);
    return merged;
  }
  // A small assistant works beside each miniature, leaving the centre for assembly.
  const agentHead = new SphereGeometry(1,24,16);
  const agentBody = new RoundedBoxGeometry(.18,.19,.13,3,.045);
  const agentJoint = new SphereGeometry(.027,12,8);
  const agentArm = new CylinderGeometry(.022,.025,.13,12);
  const agentEye = new SphereGeometry(.018,12,8);
  const agentVisor = new RoundedBoxGeometry(.19,.085,.035,3,.025);
  const agentPalm = new RoundedBoxGeometry(.065,.065,.04,2,.012);
  const agentFinger = new RoundedBoxGeometry(.014,.052,.023,2,.006);
  function moduleAgent(side, accent) {
    const group=new Group();
    group.position.set(side*.78,.08,.3);
    group.scale.setScalar(.68);
    group.rotation.y=-.25;
    const add=(geometry,mat,x,y,z,parent=group)=>{
      const mesh=new Mesh(geometry,mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
    };
    add(agentHead,ivory,0,.23,0).scale.set(.132,.112,.102);
    add(agentVisor,ink,0,.228,.083);
    for(const x of [-.043,.043])add(agentEye,accent,x,.23,.109);
    add(agentJoint,metal,0,.112,0);
    add(agentBody,ivory,0,0,0);
    add(agentVisor,ink,0,.01,.068).scale.set(.45,.5,.8);
    add(agentEye,accent,0,.01,.087).scale.set(.6,.6,.6);
    const arms=[-1,1].map(direction=>{
      const shoulder=new Group();shoulder.position.set(direction*.125,.035,0);group.add(shoulder);
      shoulder.rotation.z=direction*.6;
      add(agentJoint,ink,0,0,0,shoulder);
      add(agentArm,ivory,0,-.065,0,shoulder);
      const elbow=new Group();elbow.position.y=-.135;shoulder.add(elbow);
      add(agentJoint,accent,0,0,0,elbow);
      add(agentArm,ivory,0,-.065,0,elbow);
      const hand=new Group();hand.position.set(0,-.16,.01);elbow.add(hand);
      add(agentPalm,accent,0,0,0,hand);
      for(const x of [-.024,0,.024])add(agentFinger,ivory,x,-.05,.005,hand);
      add(agentFinger,ivory,direction*.045,-.005,.005,hand).rotation.z=-direction*.8;
      return {shoulder,elbow,hand,direction};
    });
    const scan=new Mesh(new TorusGeometry(.13,.006,6,32),accent);
    scan.rotation.x=Math.PI/2;scan.position.set(-side*.19,-.3,0);group.add(scan);
    return {group,arms,scan,side};
  }
  const nodes = buttons.map((button,i)=>{
    const scattered=[[-2.55,1.2,-.25],[-.55,1.65,.15],[2.25,1.2,-.25],[2.65,-.8,.15],[.75,-1.55,-.1],[-1.25,-1.45,.25],[-2.65,-.4,-.15]];
    const position = new Vector3(...scattered[i]);
    const group = new Group(); group.position.copy(position); root.add(group);
    const material = quality.physical?new MeshPhysicalMaterial({color:colors[i],metalness:.3,roughness:.25,clearcoat:1,emissive:colors[i],emissiveIntensity:.1}):new MeshStandardMaterial({color:colors[i],metalness:.3,roughness:.25,emissive:colors[i],emissiveIntensity:.1});
    const cube = miniature(button.dataset.flowModule,material); group.add(cube);
    const agent=moduleAgent(position.x>0?-1:1,material);group.add(agent.group);
    const halo = new Mesh(new TorusGeometry(.67,.009,8,64),new MeshBasicMaterial({color:colors[i],transparent:true,opacity:.45}));
    halo.rotation.x=Math.PI/2; halo.position.y=-.5; group.add(halo);
    const curve = new CatmullRomCurve3([new Vector3(),new Vector3(position.x*.3,position.y*.18,.8),new Vector3(position.x*.72,position.y*.8,.45),position]);
    const routeMaterial = new MeshBasicMaterial({color:colors[i],transparent:true,opacity:.24});
    const route = new Mesh(new TubeGeometry(curve,40,.007,5,false),routeMaterial); root.add(route);
    const packets = new InstancedMesh(dotGeometry,new MeshBasicMaterial({color:colors[i],transparent:true,opacity:.85}),3);
    packets.frustumCulled=false; root.add(packets);
    const trail = quality.trails ? new InstancedMesh(trailGeometry,new MeshBasicMaterial({color:colors[i],transparent:true,opacity:.55,depthWrite:false}),7) : null;
    if(trail){trail.frustumCulled=false;root.add(trail);}
    return {button,position,group,cube,agent,halo,curve,routeMaterial,material,packets,trail};
  });
  let fitDistance=10;
  let width=1,height=1,visible=false,dead=false,available=true,elapsed=0,last=0,selected=5,dark=false,velocity=0,lastProgress=null;
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
    const bell=Math.sin(merge*Math.PI);
    const flash=Math.sin(clamp((progress-.54)/.2)*Math.PI);
    const burst=smooth((progress-.6)/.3);
    const fade=1-reveal;
    root.rotation.z=bell*.08;
    // The final mark is the original inline SVG, untouched by lighting or perspective.
    root.position.y=smooth((progress-.64)/.23)*.2*Math.tan(Math.PI/10)*camera.position.z;
    const modelOpacity=1-smooth((progress-.59)/.23);
    for(const mat of [ivory,ink,metal,wood]){mat.transparent=true;mat.opacity=modelOpacity;mat.depthWrite=modelOpacity>.95;}
    core.visible=(merge>.02||flash>.01)&&reveal<.995;
    core.scale.setScalar(.55+merge*.7+flash*.18);
    coreGlow.scale.setScalar(1.2+merge*1.6+flash*1.6);
    coreGlow.material.opacity=Math.min(1,(merge*.5+flash*.55)*fade*(dark?1:.8));
    lattice.rotation.set(elapsed*.25+progress*3,elapsed*.35+progress*4.5,0);
    latticeMaterial.opacity=bell*.5+merge*fade*(dark?.35:.25);
    lattice.scale.setScalar(1-flash*.25);
    heart.scale.setScalar(.6+merge*.6+flash*.9);
    heartMaterial.opacity=merge*fade*.9;
    coreMaterial.opacity=bell*.25+merge*.45*fade;
    rings.forEach((ring,i)=>{
      const turn=progress*Math.PI*(1.2+i*.6)+elapsed*(.12+i*.05);
      ring.rotation.set(turn*(i===1?-1:1)+i*1.05,turn*.7+i*.6,turn*.3);
      ring.scale.setScalar(1.25-merge*.35);
    });
    waves.forEach((wave,i)=>{
      const w=clamp((progress-.6-i*.05)/.26);
      wave.visible=w>0&&w<1;
      wave.scale.setScalar(.4+smooth(w)*(i?5.2:3.3));
      wave.material.opacity=Math.sin(w*Math.PI)*(dark?.6:.45)*(1-w*.4);
    });
    // Dust is pulled into a vortex, then released outward as the brand mark appears.
    const pull=smooth((progress-.1)/.52);
    particleMaterial.opacity=(dark?.85:.75)*(.6+pull*.4)*(1-burst);
    particles.visible=particleMaterial.opacity>.01;
    if(particles.visible)particleSeeds.forEach((p,i)=>{
      const angle=p.angle+elapsed*.03*p.speed+pull*2.6*p.speed;
      const radius=p.radius*(1-pull*p.pull)+burst*(1.6+p.radius*.55);
      const drift=Math.sin(elapsed*.5*p.speed+p.phase)*.08*(1-pull);
      particlePositions[i*3]=Math.cos(angle)*radius;
      particlePositions[i*3+1]=Math.sin(angle)*radius*.62+drift;
      particlePositions[i*3+2]=p.z*(1-pull*.85);
    });
    if(particles.visible)particleGeometry.attributes.position.needsUpdate=true;
    particleMaterial.size=.15+bell*.06;
    const trailStrength=Math.min(1,velocity*55);
    const packetScale=1-smooth((progress-.16)/.38);
    const labelsShown=progress<.46;
    nodes.forEach((node,i)=>{
      const active=i===selected;
      const pose=assemblyPose(progress,i,node.position.toArray());
      node.group.position.fromArray(pose.position);
      node.cube.rotation.y=-.48+Math.sin(elapsed*.4+i)*.07*(1-pose.travel)+Math.sin(pose.travel*Math.PI)*.3*(i%2?1:-1);
      node.cube.rotation.z=Math.sin(pose.travel*Math.PI)*.1*(i%2?1:-1);
      node.cube.position.y=Math.sin(elapsed*.7+i)*.025*(1-pose.travel);
      node.group.scale.setScalar((active?1.06:1)*1.4*pose.scale);
      node.group.visible=pose.opacity>.005;
      const agentMotion=motion.matches?0:Math.sin(elapsed*1.8+i*.9);
      node.agent.group.visible=progress<.58;
      node.agent.group.position.y=.08+agentMotion*.022;
      node.agent.group.rotation.z=agentMotion*.045;
      node.agent.arms.forEach(({shoulder,elbow,hand,direction})=>{
        const working=direction===-node.agent.side;
        shoulder.rotation.z=direction*(working?.95+agentMotion*.22:.45-agentMotion*.08);
        elbow.rotation.x=working?-.7-agentMotion*.3:-.18;
        hand.rotation.z=agentMotion*(working?.2:.08);
      });
      node.agent.scan.scale.setScalar(.85+agentMotion*.12);
      node.agent.scan.position.y=-.3+agentMotion*.025;
      node.material.transparent=true;node.material.opacity=pose.opacity;node.material.depthWrite=pose.opacity>.95;
      node.halo.material.opacity=.32*(1-pose.travel);
      node.halo.rotation.z=elapsed*.3;
      node.material.emissiveIntensity=active?.08:.015;
      node.routeMaterial.opacity=(active?.32:.12)*(1-smooth((progress-.1)/.35));
      if(node.trail){
        // Instanced trail: strength shrinks each ghost instead of changing per-instance opacity.
        node.trail.visible=trailStrength>.02&&pose.travel>0&&pose.travel<1;
        if(node.trail.visible){
          for(let k=0;k<7;k++){
            const past=assemblyPose(progress-(k+1)*.014,i,node.position.toArray());
            const strength=trailStrength*Math.sin(past.travel*Math.PI)*past.opacity*(1-k/7);
            if(strength<.02){node.trail.setMatrixAt(k,hidden);continue;}
            placer.position.fromArray(past.position);
            placer.scale.setScalar((1.6-k*.16)*(.5+past.scale*.5)*strength);
            placer.updateMatrix();node.trail.setMatrixAt(k,placer.matrix);
          }
          node.trail.instanceMatrix.needsUpdate=true;
        }
      }
      node.halo.scale.setScalar(1+Math.sin(pose.travel*Math.PI)*.35);
      node.packets.visible=packetScale>.01;
      if(node.packets.visible){
        for(let j=0;j<3;j++){
          // Data packets travel from each department into the shared core.
          node.curve.getPoint(1-(elapsed*.14+j/3+i*.11)%1,placer.position);
          placer.scale.setScalar((active?1.15:.7)*packetScale);
          placer.updateMatrix();node.packets.setMatrixAt(j,placer.matrix);
        }
        node.packets.instanceMatrix.needsUpdate=true;
      }
      // Labels fade out early in the scroll; skip their style writes once hidden.
      if(labelsShown){
        node.group.getWorldPosition(projected);projected.project(camera);
        node.button.style.setProperty('--node-x',`${(projected.x*.5+.5)*width}px`);
        node.button.style.setProperty('--node-y',`${(-projected.y*.5+.5)*height+(node.position.y>0?-102:74)}px`);
      }
    });
    renderer.render(scene,camera);
  };
  // Past the final hold only the HTML mark is visible, so the loop can stop entirely.
  const settled = () => progress>=.97 && velocity<.0005;
  let looping=false;
  const frame = time => {
    const scrolling=velocity>.0005;
    const budget=scrolling?quality.frameMs:quality.idleFrameMs;
    const interval=time-last;
    if(interval<budget-2)return;
    last=time;
    governor.sample(interval,budget);
    elapsed+=Math.min(interval/1000,.05);velocity*=.86;render();
    if(settled())sync();
  };
  const onAssembly = event => {
    progress=event.detail.progress;
    if(lastProgress!==null)velocity=Math.min(.05,velocity+Math.abs(progress-lastProgress));
    lastProgress=progress;
    if(looping)return; // the next frame draws it
    sync();
  };
  const sync = () => {
    if(dead)return;
    const run=visible && !document.hidden && !motion.matches && available && !settled();
    if(run!==looping){looping=run;last=performance.now();renderer.setAnimationLoop(run?frame:null);}
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
    coreMaterial.color.setHex(colors[selected]);
    const description=host.querySelector('[data-flow-description]');if(description)description.textContent=descriptions[selected];
    render();
  };
  const pointer = event => {
    if(event.pointerType!=='mouse' || motion.matches)return;
    const bounds=stage.getBoundingClientRect();
    targetX=(event.clientX-bounds.left)/width-.5;targetY=(event.clientY-bounds.top)/height-.5;
  };
  const leave = () => {targetX=targetY=0;};
  const theme = () => {dark=document.documentElement.dataset.theme==='dark';light.intensity=dark?3.6:3.1;render();};
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
    geometries.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());environmentMap.dispose();glowTexture.dispose();light.shadow.dispose();renderer.dispose();renderer.domElement.remove();host.classList.remove('is-connected');buttons.forEach(button=>button.disabled=true);
  };
}
