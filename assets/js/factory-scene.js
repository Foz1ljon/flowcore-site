import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, BoxGeometry, CylinderGeometry,
  SphereGeometry, MeshStandardMaterial, CanvasTexture, SRGBColorSpace, RepeatWrapping,
  AmbientLight, DirectionalLight, ACESFilmicToneMapping, PCFSoftShadowMap, Vector3,
  PMREMGenerator, Color, TorusGeometry, InstancedMesh, CapsuleGeometry, HemisphereLight,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// A cutaway furniture workshop. Dimensions are in metres; the same building and
// equipment remain in both states. Software changes the information, not the factory.
export function mountFactory(host) {
  const story = host.closest('[data-factory-story]');
  const state=story.dataset.state;
  const pauseButton=host.querySelector('.factory-pause');
  const compact=matchMedia('(max-width: 760px)').matches;
  const renderer = new WebGLRenderer({antialias:!compact,alpha:false,powerPreference:'low-power',failIfMajorPerformanceCaveat:true});
  renderer.setPixelRatio(1);
  // The building never moves: render its shadow map once, not on every animation frame.
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=PCFSoftShadowMap;
  renderer.toneMapping=ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
  renderer.outputColorSpace=SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden','true');
  host.prepend(renderer.domElement);
  const scene=new Scene();scene.background=new Color('#d7dddf');
  const camera=new PerspectiveCamera(37,1,.1,150);
  const environment=new PMREMGenerator(renderer),room=new RoomEnvironment();
  const env=environment.fromScene(room,.04,.1,100,{size:compact?64:128});scene.environment=env.texture;room.dispose();environment.dispose();
  scene.add(new AmbientLight(0xe4edf4,.4),new HemisphereLight(0xe4eff9,0x677265,1.5));
  const sun=new DirectionalLight(0xfff2df,3.1);sun.position.set(-7,17,8);sun.castShadow=true;
  sun.shadow.mapSize.set(compact?512:1024,compact?512:1024);Object.assign(sun.shadow.camera,{left:-17,right:17,top:14,bottom:-14,near:1,far:50});
  sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;scene.add(sun);
  const fill=new DirectionalLight(0xc4d9eb,.9);fill.position.set(10,7,-8);scene.add(fill);
  const root=new Group();scene.add(root);
  const textures=[];
  function texture(kind) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const c=canvas.getContext('2d');let seed=17;
    const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
    c.fillStyle=kind==='wood'?'#bd996c':'#9caaa9';c.fillRect(0,0,256,256);
    for(let i=0;i<2500;i++) {
      c.fillStyle=kind==='wood'?`rgba(80,47,19,${random()*.14})`:`rgba(25,42,40,${random()*.14})`;
      const x=random()*256,y=random()*256;c.fillRect(x,y,kind==='wood'?random()*100+10:random()*3+1,random()*2+.3);
    }
    if(kind!=='wood'){c.strokeStyle='#758582';c.lineWidth=.7;c.strokeRect(0,0,256,256);}
    const tex=new CanvasTexture(canvas);tex.colorSpace=SRGBColorSpace;tex.wrapS=tex.wrapT=RepeatWrapping;
    if(kind!=='wood')tex.repeat.set(8,6);textures.push(tex);return tex;
  }
  const mat=(color,metalness=0,roughness=.65)=>new MeshStandardMaterial({color,metalness,roughness});
  const concrete=new MeshStandardMaterial({map:texture('floor'),roughness:.88});
  const wood=new MeshStandardMaterial({map:texture('wood'),roughness:.48});
  const steel=mat('#6b777b',.65,.42),dark=mat('#303a3d',.4,.6),white=mat('#d2d5cc',.22,.48);
  const blue=mat('#526b72',.35,.45),orange=mat('#b98548',.3,.48),rubber=mat('#252a2b',.05,.95);
  const yellow=mat('#dbb85a',.1,.7),glass=mat('#8bafbc',.55,.18),paper=mat('#eeece3');
  const red=mat('#b96847'),green=mat('#51877c'),skin=mat('#bc947a');
  const wall=mat('#c7cbc5',.05,.9),duct=mat('#9aabae',.6,.5),cardboard=mat('#af9370',0,.95);
  const lampMaterial=mat('#eee9d9',0,.4);lampMaterial.emissive=new Color('#fff0cc');lampMaterial.emissiveIntensity=.55;
  const screen=mat('#283e42',.1,.4),screenLine=mat('#8dbbb1',.1,.6);
  const dynamic=new Set();
  // Unit geometries are shared by every repeated object, including both factory views.
  const unitBox=new BoxGeometry(1,1,1),cylinders=new Map();
  const before=new Group(),after=new Group();root.add(before,after);
  function box(parent,w,h,d,x,y,z,material) {
    const m=new Mesh(unitBox,material);m.scale.set(w,h,d);m.position.set(x,y,z);
    m.castShadow=m.receiveShadow=true;parent.add(m);return m;
  }
  function cylinder(parent,r,h,x,y,z,material,segments=12) {
    if(!cylinders.has(segments))cylinders.set(segments,new CylinderGeometry(1,1,1,segments));
    const m=new Mesh(cylinders.get(segments),material);m.scale.set(r,h,r);m.position.set(x,y,z);
    m.castShadow=m.receiveShadow=true;parent.add(m);return m;
  }
  function beam(parent,a,b,r,material) {
    const start=new Vector3(...a),end=new Vector3(...b),v=end.clone().sub(start);
    const m=cylinder(parent,r,v.length(),...start.clone().add(end).multiplyScalar(.5).toArray(),material,8);
    m.quaternion.setFromUnitVectors(new Vector3(0,1,0),v.normalize());return m;
  }
  // Concrete slab, expansion joints, structural steel and a low cutaway envelope.
  box(root,23,.36,14,0,-.22,0,concrete);
  box(root,23,.15,14.2,0,-.47,0,dark);
  box(root,23,4.5,.18,0,2.05,-7,wall);
  box(root,.18,4.5,14,-11.5,2.05,0,wall);
  // Wall cladding seams, lower impact guards and a steel-framed service door.
  for(let x=-11;x<11.5;x+=1.15)box(root,.014,4.3,.025,x,2.05,-6.88,white);
  box(root,22,.38,.12,0,.2,-6.84,steel);box(root,.12,.38,13,-11.34,.2,0,steel);
  box(root,1.2,2.3,.06,9.5,1.15,-6.83,blue);box(root,.075,.22,.06,9.95,1.05,-6.77,dark);
  for(let z=-6;z<7;z+=2)box(root,.025,.018,12.8,z*1.6,.005,0,steel);
  for(let x=-10;x<12;x+=4) {
    box(root,.18,4.6,.18,x,2.1,-6.7,steel);
    box(root,3.5,1.15,.08,x+1.75,3.15,-6.78,glass);
    for(let j=0;j<4;j++)box(root,.045,1.18,.1,x+j*.85+.45,3.15,-6.72,steel);
    box(root,3.8,.13,.25,x+1.8,4.4,-6.7,steel);
  }
  for(let z=-6;z<7;z+=4)box(root,.2,4.6,.2,-11.25,2.1,z,steel);
  // Overhead services and suspended luminaires, with the roof removed for visibility.
  for(let x=-8;x<10;x+=6){
    box(root,.16,.2,13,x,4.45,0,steel);
    for(let z=-4;z<6;z+=4){
      beam(root,[x,4.4,z],[x,3.9,z],.015,steel);
      box(root,1.7,.09,.24,x,3.85,z,white);
      box(root,1.5,.025,.2,x,3.79,z,lampMaterial);
    }
  }
  // Open roof trusses and corrugated roof strips along the back retain the factory silhouette.
  for(let x of [-8,-2,4,10]){
    beam(root,[x,4.45,-6.7],[x,5.4,0],.045,steel);
    beam(root,[x,5.4,0],[x,4.45,6.5],.045,steel);
    for(let z=-6;z<6;z+=2){
      beam(root,[x,4.45,z],[x,5.35-Math.abs(z+1)*.13,z+1],.025,steel);
      beam(root,[x,5.35-Math.abs(z+1)*.13,z+1],[x,4.45,z+2],.025,steel);
    }
  }
  for(let z of [-6.5,-5.8])box(root,22.5,.045,.6,0,4.66,z,duct);
  beam(root,[-10.6,3.9,-5.8],[5.5,3.9,-5.8],.18,duct);
  for(let x of [-8,-4,0,4]){
    const collar=cylinder(root,.198,.055,x,3.9,-5.8,dark);collar.rotation.z=Math.PI/2;
  }
  // Dust extraction unit and flexible hose connected to the cutter.
  box(root,1.3,1.45,.85,-4.8,.75,-5.8,white);
  cylinder(root,.3,1.4,-5.16,2.15,-5.8,paper);cylinder(root,.3,1.4,-4.44,2.15,-5.8,paper);
  beam(root,[-4.8,2.9,-5.8],[-4.8,3.9,-5.8],.12,duct);
  beam(root,[-2.3,3.45,-5],[-2.3,3.45,-5.8],.12,duct);
  // Electrical cabinets, vents, safety equipment and labelled work areas.
  box(root,1.1,1.8,.48,5.6,.95,-6.45,white);
  box(root,.025,1.6,.025,5.6,.95,-6.19,dark);
  for(let y=.3;y<.8;y+=.08)box(root,.65,.025,.02,5.6,y,-6.19,steel);
  cylinder(root,.12,.62,-10.95,.9,1.4,red);box(root,.23,.08,.2,-10.95,1.25,1.4,dark);
  // Two yellow safety bollards at the dispatch edge.
  for(let x of [5.1,10.1])cylinder(root,.075,.9,x,.45,4.2,yellow);
  for(let z of [-5.9,5.9])box(root,21,.012,.07,0,.003,z,yellow);
  for(let x of [-4.4,4.4])box(root,.07,.012,11.8,x,.004,0,yellow);
  for(let z=-5;z<6;z+=1.2)box(root,.4,.015,.08,-10.3,.01,z,yellow);
  // Raw sheet storage: a heavy-duty rack with stacked wood panels and steel bracing.
  function rack(x,z) {
    for(let dx of [-1.7,1.7])for(let dz of [-.75,.75])box(root,.12,3.5,.12,x+dx,1.65,z+dz,blue);
    for(let y of [.15,1.2,2.3]) {
      for(let dz of [-.76,.76])box(root,3.6,.12,.1,x,y,z+dz,orange);
      for(let i=0;i<6;i++)box(root,3.15,.065,1.35,x,y+.13+i*.075,z,wood);
    }
    beam(root,[x-1.7,.1,z-.76],[x+1.7,3.3,z-.76],.025,steel);
  }
  rack(-8,-4.8);rack(-8,-1.8);
  function pallet(parent,x,z,count=5) {
    for(let i=0;i<3;i++)box(parent,.18,.16,1.1,x+(i-1)*.5,.08,z,wood);
    for(let i=0;i<5;i++)box(parent,1.4,.06,.16,x,.19,z+(i-2)*.22,wood);
    for(let i=0;i<count;i++)box(parent,1.3,.085,1,x,.28+i*.09,z,wood);
  }
  pallet(root,-8,2.1,9);pallet(root,-6,2.1,6);
  // CNC panel saw: enclosed gantry, detailed control panel, extraction hose and rails.
  const saw=new Group();saw.position.set(-1.6,0,-3);root.add(saw);
  box(saw,4.5,.75,2.6,0,.48,0,white);box(saw,4.7,.14,2.8,0,.96,0,steel);
  for(let z=-1.2;z<=1.2;z+=.3)box(saw,4.35,.05,.08,0,1.06,z,dark);
  box(saw,2.6,.07,1.4,0,1.13,0,wood);
  for(let x of [-2,2]){box(saw,.2,1.25,.26,x,1.65,0,blue);box(saw,.25,.1,2.6,x,1.1,0,steel);}
  box(saw,4.25,.35,.45,0,2.22,0,blue);
  const tool=box(saw,.48,.65,.52,-.7,1.81,0,white);dynamic.add(tool);tool.castShadow=false;
  for(let x=-1.8;x<2;x+=.22)box(saw,.06,.08,.46,x,2.05,0,dark);
  for(let x of [-1.75,1.75])for(let y of [.32,.7]){
    const bolt=cylinder(saw,.035,.015,x,y,1.31,steel,8);bolt.rotation.x=Math.PI/2;
  }
  for(let z of [-.8,.8])box(saw,4.25,.065,.045,0,1.2,z,steel);
  cylinder(saw,.13,.6,-.7,2.6,0,dark);
  beam(saw,[-.7,2.9,0],[-.7,3.45,-2],.12,steel);
  box(saw,.7,.88,.3,2.5,1.5,.8,steel);
  box(saw,.54,.37,.035,2.5,1.66,.97,screen);
  for(let i=0;i<4;i++)box(saw,.33-i*.04,.014,.01,2.46,1.77-i*.065,.994,screenLine);
  for(let i=0;i<4;i++)cylinder(saw,.045,.03,2.3+i*.13,1.19,1, i===0?red:green).rotation.x=Math.PI/2;
  // Roller transfer table and stacks between cutting and assembly.
  box(root,3.6,.12,1.7,-1.6,.87,1.3,steel);
  for(let x=-3.3;x<.2;x+=.25){const roller=cylinder(root,.065,1.65,x,.98,1.3,steel);roller.rotation.x=Math.PI/2;}
  for(let x of [-3.2,0])for(let z of [.65,1.95])box(root,.1,.85,.1,x,.43,z,steel);
  pallet(root,1.6,-3,5);
  function worktable(x,z) {
    box(root,2.6,.14,1.5,x,.95,z,wood);
    for(let dx of [-1.05,1.05])for(let dz of [-.55,.55])box(root,.09,.9,.09,x+dx,.45,z+dz,steel);
    box(root,.5,.15,.3,x+.7,1.11,z-.35,blue);
    box(root,.45,.025,.3,x-.6,1.04,z+.3,paper);
    box(root,1.7,.08,.7,x,1.11,z,wood);
  }
  worktable(3.4,-4.5);worktable(3.4,-1.4);
  // Finished desks retain plausible 74cm height and separate tops/legs.
  function desk(parent,x,z,rotation=0) {
    const g=new Group();g.position.set(x,0,z);g.rotation.y=rotation;parent.add(g);
    box(g,1.5,.07,.75,0,.76,0,wood);
    for(let dx of [-.63,.63]){
      box(g,.065,.7,.065,dx,.36,-.27,dark);box(g,.065,.7,.065,dx,.36,.27,dark);
      box(g,.07,.06,.65,dx,.08,0,dark);
    }
    box(g,1.3,.12,.04,0,.55,-.25,dark);
  }
  for(let x of [6,8])for(let z of [-4.7,-3.5,-2.3])desk(root,x,z);
  // Shipping station: palletised flat-packs with packing straps and dispatch scanner.
  for(let x of [6.2,8.2])for(let z of [.3,2.2]){
    pallet(root,x,z,1);
    for(let y=0;y<4;y++){
      box(root,1.38,.22,1,x,.48+y*.23,z,cardboard);
      for(let dx of [-.42,.42])box(root,.045,.225,1.02,x+dx,.48+y*.23,z,dark);
    }
    box(root,.3,.16,.015,x,1.16,z+.51,paper);
  }
  box(root,1.6,.1,.9,9.6,1,-.2,white);box(root,.45,.5,.45,9.6,.7,-.2,steel);
  box(root,.48,.33,.06,9.6,1.25,-.4,dark);box(root,.42,.26,.015,9.6,1.25,-.36,screen);
  for(let i=0;i<3;i++)box(root,.28,.012,.009,9.58,1.32-i*.055,-.349,screenLine);
  // Forklift in the cross-aisle, with tyres, steel forks, protective cage and seat.
  const forklift=new Group();forklift.position.set(-6,0,4.4);root.add(forklift);
  box(forklift,1.15,.65,1.65,0,.55,0,orange);box(forklift,1.1,.22,.55,0,.95,-.55,orange);
  for(let x of [-.58,.58])for(let z of [-.52,.52]){
    const tyre=cylinder(forklift,.3,.18,x,.3,z,rubber);tyre.rotation.z=Math.PI/2;
    const hub=cylinder(forklift,.13,.19,x,.3,z,steel);hub.rotation.z=Math.PI/2;
  }
  for(let x of [-.49,.49])for(let z of [-.5,.55])box(forklift,.055,1.55,.055,x,1.6,z,dark);
  box(forklift,1.1,.08,1.2,0,2.4,0,dark);box(forklift,.6,.13,.5,0,1.01,-.1,rubber);
  box(forklift,.6,.5,.12,0,1.25,-.35,rubber);
  for(let x of [-.36,.36]){
    box(forklift,.09,2,.12,x,1.04,1,dark);box(forklift,.11,.07,1.15,x,.19,1.45,steel);
  }
  const wheel=new Mesh(new TorusGeometry(.17,.025,8,20),rubber);wheel.position.set(0,1.3,.45);wheel.rotation.x=-.5;forklift.add(wheel);
  // Delivery vehicle, cropped building edge and open loading bay.
  // The truck waits in an outdoor yard beside the open dispatch side, so it never hides the floor.
  const asphalt=mat('#7b8486',.05,.95);
  box(root,3.4,.3,8.6,13.2,-.2,1.4,asphalt);
  for(let z=-2;z<5;z+=2.3)box(root,1,.012,.08,13.2,-.04,z,white);
  const truck=new Group();truck.position.set(13.2,0,.9);root.add(truck);
  box(truck,1.9,1.8,3.1,0,1.45,-.4,white);box(truck,1.85,1.25,1.25,0,1.1,1.7,blue);
  box(truck,1.65,.55,.04,0,1.55,2.34,glass);box(truck,1.95,.15,.15,0,.5,2.38,steel);
  for(let x of [-.9,.9])for(let z of [-1.4,1.6]){
    const tyre=cylinder(truck,.36,.22,x,.38,z,rubber);tyre.rotation.z=Math.PI/2;
    const hub=cylinder(truck,.17,.24,x,.38,z,steel);hub.rotation.z=Math.PI/2;
  }
  // Workers: human proportions, work clothes, arms and safety helmets.
  const limbGeometry=new CapsuleGeometry(1,3,3,7);
  const headGeometry=new SphereGeometry(1,10,8);
  function limb(parent,material,x,y,z,sx,sy,sz,angle=0){
    const mesh=new Mesh(limbGeometry,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.rotation.z=angle;mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  function worker(x,z,turn=0) {
    const person=new Group();person.position.set(x,0,z);person.rotation.y=turn;root.add(person);
    for(let side of [-1,1]){
      limb(person,dark,side*.115,.44,0,.075,.14,.085);box(person,.17,.12,.3,side*.115,.07,.06,rubber);
      beam(person,[side*.27,1.4,0],[side*.33,1.04,.12],.065,blue);
      beam(person,[side*.33,1.04,.12],[side*.2,.9,.28],.055,skin);
    }
    limb(person,blue,0,1.18,0,.21,.105,.135);box(person,.41,.045,.275,0,1.12,0,yellow);
    cylinder(person,.065,.12,0,1.5,0,skin);
    const head=new Mesh(headGeometry,skin);head.scale.set(.13,.16,.13);head.position.set(0,1.68,0);head.castShadow=true;person.add(head);
    cylinder(person,.17,.07,0,1.82,0,yellow);cylinder(person,.2,.025,0,1.8,0,yellow);
  }
  worker(-4.4,-2,.8);worker(2,-4.4,1.5);worker(3.3,.2,Math.PI);worker(9.6,1.4,Math.PI);
  // Separate physical scenarios: a blocked idle line versus staged material and work in progress.
  for(let i=0;i<12;i++){
    const scrap=box(before,1.1,.07,.65,-4.8+(i%3)*.5,.08+Math.floor(i/3)*.09,2.6+Math.floor(i/3)*.5,wood);
    scrap.rotation.y=(i%4)*.43;
  }
  pallet(before,-2,3.5,0);
  for(let i=0;i<7;i++)box(before,.32,.015,.22,2.7+(i%4)*.18,1.22+(i%2)*.025,-4.1+Math.floor(i/4)*.2,paper).rotation.y=i*.5;
  // Safety barriers make the stalled area immediately legible from either camera.
  for(let x of [-3.2,0]){
    cylinder(before,.11,.1,x,.05,2.5,dark);
    cylinder(before,.035,.8,x,.45,2.5,orange);
  }
  box(before,3.3,.13,.06,-1.6,.8,2.5,yellow);
  for(let x=-3;x<0;x+=.4)box(before,.16,.14,.07,x,.8,2.5,dark).rotation.z=-.35;
  for(let i=0;i<3;i++){
    const abandoned=box(before,1.4,.065,.7,1.1+i*.2,.15+i*.08,1.5+i*.3,wood);abandoned.rotation.y=i*.35;
  }
  // The extra 24 panels have been received; organised stock now feeds the saw.
  pallet(after,-6,3.8,12);pallet(after,-8,3.8,12);
  for(let i=0;i<3;i++)box(after,1.65,.075,.72,3.4,1.22+i*.08,-1.4,wood);
  const movingPanel=box(after,1.5,.07,.8,-3,1.1,1.3,wood);dynamic.add(movingPanel);movingPanel.castShadow=false;
  desk(after,3.5,1.8);desk(after,5.2,1.8);
  before.visible=state==='before';after.visible=state==='after';
  // Stack lights: amber/red where the old process is blocked, one light per stage after.
  const stations=[[-7.4,3.55,-3.3],[-1.6,2.53,-3],[4.9,1.6,-3],[9.6,1.6,-.65]];
  const beaconBase=[],beaconMaterials=[];
  stations.forEach(([x,y,z],i)=>{
    beam(root,[x,i===1?y-.1:0,z],[x,y,z],.03,dark);
    if(state==='before'){
      const lens=i===1?red:i===3?mat('#7d8586',.1,.6):yellow;
      cylinder(root,.075,.18,x,y+.1,z,lens);return;
    }
    const lens=mat('#3f8f80',.1,.35);lens.emissive=new Color('#36b89f');lens.emissiveIntensity=.15;
    beaconMaterials.push(lens);beaconBase.push(cylinder(after,.075,.18,x,y+.1,z,lens));
  });
  // FlowCore floor display: the order's live stage board on the back wall.
  const boardCanvas=document.createElement('canvas');boardCanvas.width=512;boardCanvas.height=256;
  const boardTexture=new CanvasTexture(boardCanvas);boardTexture.colorSpace=SRGBColorSpace;textures.push(boardTexture);
  const boardMaterial=new MeshStandardMaterial({color:'#000',emissive:'#fff',emissiveMap:boardTexture,roughness:.4});
  const stageNames=['Ombor','Kesish','Yig‘ish','Jo‘natish'];
  function drawBoard(active) {
    const c=boardCanvas.getContext('2d');
    c.fillStyle='#16282b';c.fillRect(0,0,512,256);
    c.fillStyle='#e9f3f0';c.font='600 30px system-ui, sans-serif';c.fillText('№1042 · 40 ta stol',26,48);
    c.fillStyle='#7fd0bd';c.font='500 20px system-ui, sans-serif';c.fillText('FlowCore',390,46);
    stageNames.forEach((name,i)=>{
      const x=26+i*119,done=i<active,current=i===active;
      c.fillStyle=done?'#2f8f7c':current?'#47c3a6':'#2c3f42';c.fillRect(x,82,107,92);
      c.fillStyle=done||current?'#f4fbf9':'#8ea2a2';c.font='700 38px system-ui, sans-serif';
      c.fillText(done?'✓':String(i+1),x+14,138);
      c.font='600 17px system-ui, sans-serif';c.fillText(name,x+8,200);
      c.fillStyle='#2c3f42';c.fillRect(x,212,107,10);
      c.fillStyle='#47c3a6';c.fillRect(x,212,done?107:current?64:0,10);
    });
    boardTexture.needsUpdate=true;
  }
  if(state==='after'){
    // Suspended from the roof truss and turned towards the visitor, like a shop-floor andon board.
    const display=new Group();display.position.set(1.2,2.8,1.4);display.rotation.y=.6;after.add(display);
    box(display,3.3,1.75,.1,0,0,0,dark);
    const board=box(display,3.12,1.56,.02,0,0,.06,boardMaterial);board.castShadow=false;
    for(let x of [-1.3,1.3])beam(display,[x,.87,0],[x,2.65,0],.02,steel);
  }
  // Order route: floor line, a ring per stage, and the order card travelling between them.
  const routeMat=mat('#438c81',.25,.4);routeMat.emissive=new Color('#245e56');routeMat.emissiveIntensity=.3;
  const stops=[-7,-1.6,3.4,8.4],routeZ=3.3;
  for(let i=0;i<stops.length-1;i++)beam(after,[stops[i],.045,routeZ],[stops[i+1],.045,routeZ],.035,routeMat);
  const ringGeometry=new TorusGeometry(.3,.04,8,28),rings=[];
  for(let x of stops){
    const ring=new Mesh(ringGeometry,routeMat);ring.rotation.x=Math.PI/2;ring.position.set(x,.06,routeZ);after.add(ring);dynamic.add(ring);rings.push(ring);
  }
  const tokenMat=mat('#5fd0b5',.1,.35);tokenMat.emissive=new Color('#3ec2a2');tokenMat.emissiveIntensity=.9;
  const token=box(after,.62,.1,.42,stops[0],.16,routeZ,tokenMat);dynamic.add(token);token.castShadow=false;
  // A soft floor halo marks the station that is working on the order right now.
  const halos=[[-8,-.6,1.3],[-1.6,-.9,1.5],[3.4,.2,1.3],[10.6,1.2,1.1]];
  const glowMat=new MeshStandardMaterial({color:'#3fae95',emissive:'#2c9c83',emissiveIntensity:.55,roughness:.5,transparent:true,opacity:.72,depthWrite:false});
  const glow=cylinder(after,1,.02,halos[0][0],.03,halos[0][1],glowMat,40);glow.castShadow=glow.receiveShadow=false;dynamic.add(glow);
  // A packed box rolls out to the truck during dispatch.
  const outgoing=box(after,1.1,.5,.8,10.4,.26,1.2,cardboard);outgoing.castShadow=false;dynamic.add(outgoing);
  // Several hundred repeated bolts, panels and beams become a few GPU draw calls.
  // Hidden variants are excluded entirely; only the chosen scene is uploaded.
  root.updateMatrixWorld(true);
  const batches=new Map(),staticMeshes=[];
  let sourceMeshCount=0;
  root.traverseVisible(object=>{
    if(!object.isMesh)return;
    sourceMeshCount++;
    if(dynamic.has(object))return;
    const key=`${object.geometry.uuid}:${object.material.uuid}:${object.castShadow}`;
    if(!batches.has(key))batches.set(key,[]);
    batches.get(key).push(object);staticMeshes.push(object);
  });
  for(const meshes of batches.values()){
    const first=meshes[0],batch=new InstancedMesh(first.geometry,first.material,meshes.length);
    batch.castShadow=first.castShadow;batch.receiveShadow=true;
    meshes.forEach((mesh,i)=>batch.setMatrixAt(i,mesh.matrixWorld));
    batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();scene.add(batch);
  }
  staticMeshes.forEach(mesh=>mesh.removeFromParent());
  // Small internal metrics support performance QA without adding UI controls.
  host.dataset.factorySourceMeshes=String(sourceMeshCount);
  host.dataset.factoryBatches=String(batches.size);
  const markerPositions=[new Vector3(-7.4,4,-3.3),new Vector3(-1.6,3.05,-3),new Vector3(4.9,2.05,-3),new Vector3(9.6,2.05,-.65)];
  const labels=[...host.querySelectorAll('[data-factory-label]')];
  const STAGE_SECONDS=3.6;let stage=-1;
  function setStage(next) {
    if(next===stage||state!=='after')return;stage=next;
    labels.forEach((label,i)=>{label.classList.toggle('is-active',i===stage);label.classList.toggle('is-done',i<stage);});
    beaconMaterials.forEach((m,i)=>{m.emissiveIntensity=i<stage?.35:i===stage?1.4:.05;m.color.set(i>stage?'#5d7470':'#3f8f80');});
    const [hx,hz,hr]=halos[stage];glow.position.set(hx,.03,hz);glow.scale.set(hr,.02,hr);drawBoard(stage);
  }
  function animateAfter(t) {
    const cycle=t%(STAGE_SECONDS*4),current=Math.floor(cycle/STAGE_SECONDS),local=cycle/STAGE_SECONDS-current;
    setStage(current);
    // The card waits at its stage, then travels to the next stop in the last third.
    const move=Math.max(0,(local-.66)/.34),ease=move*move*(3-2*move);
    const from=stops[current],to=current<3?stops[current+1]:stops[0];
    token.position.x=from+(to-from)*ease;token.position.y=.16+Math.sin(ease*Math.PI)*.25*(current<3?1:0);
    token.visible=current<3||local<.66;
    rings.forEach((ring,i)=>{const s=i===current?1+.18*Math.sin(t*5):i<current?1:.85;ring.scale.set(s,s,s);});
    glowMat.opacity=.62+.12*Math.sin(t*3);
    tool.position.x=current===1?Math.sin(local*Math.PI*2)*1.3:-.7;
    movingPanel.position.x=current===1?-3.2+local*1.6:current===2?-1.6+local*1.6:-3.2;
    outgoing.position.x=current===3?10.4+Math.min(1,local*1.4)*1.5:10.4;
  }
  let view='overview',visible=false,dead=false,frame=0,paused=false,last=0,time=0,lastRender=0,labelsDirty=true;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const views={overview:{position:new Vector3(17,15,22),target:new Vector3(0,.6,-.3)},floor:{position:new Vector3(13,7.5,18),target:new Vector3(-1,1.3,-1.5)}};
  camera.position.copy(views.overview.position);const target=views.overview.target.clone();
  function projectLabels() {
    markerPositions.forEach((p,i)=>{
      const v=p.clone().project(camera);labels[i].style.left=`${(v.x*.5+.5)*100}%`;labels[i].style.top=`${(-v.y*.5+.5)*100}%`;
    });
  }
  function render() {
    camera.lookAt(target);camera.updateMatrixWorld();
    if(labelsDirty){projectLabels();labelsDirty=false;}
    renderer.render(scene,camera);
    host.dataset.factoryDrawCalls=String(renderer.info.render.calls);
    host.dataset.factoryTriangles=String(renderer.info.render.triangles);
  }
  function drawOnce(){if(!dead)render();}
  function loop(now) {
    frame=0;if(dead||!visible||document.hidden)return;
    // Keep motion smooth enough for a product illustration without 60/120fps GPU load.
    if(now-lastRender<1000/24){frame=requestAnimationFrame(loop);return;}
    lastRender=now;
    const dt=Math.min((now-(last||now))/1000,.1);last=now;
    const desired=views[view];
    const smoothing=motion.matches?1:1-Math.exp(-7*dt);
    labelsDirty=camera.position.distanceTo(desired.position)>.001||target.distanceTo(desired.target)>.001;
    camera.position.lerp(desired.position,smoothing);target.lerp(desired.target,smoothing);
    if(!paused&&!motion.matches){
      time+=dt;
      if(state==='after')animateAfter(time);
    }
    render();
    // No continuous GPU work for reduced-motion visitors.
    const cameraMoving=camera.position.distanceTo(desired.position)>.01||target.distanceTo(desired.target)>.01;
    if(!motion.matches&&(cameraMoving||(state==='after'&&!paused)))frame=requestAnimationFrame(loop);
  }
  function schedule(){if(!frame&&visible&&!document.hidden&&!dead){last=0;lastRender=0;frame=requestAnimationFrame(loop);}}
  function resize(){
    const {width,height}=host.getBoundingClientRect();if(!width||!height)return;
    renderer.setPixelRatio(Math.min(devicePixelRatio,width<600?1:1.25));
    renderer.setSize(width,height,false);camera.aspect=width/height;labelsDirty=true;
    camera.fov=2*Math.atan(Math.tan(37*Math.PI/360)*Math.max(1,1.65/camera.aspect))*180/Math.PI;camera.updateProjectionMatrix();drawOnce();schedule();
  }
  const onClick=event=>{
    const viewButton=event.target.closest('[data-factory-camera]');
    if(viewButton)labelsDirty=true;
    if(viewButton){view=viewButton.dataset.factoryCamera;host.querySelectorAll('[data-factory-camera]').forEach(b=>b.setAttribute('aria-pressed',String(b===viewButton)));if(motion.matches){camera.position.copy(views[view].position);target.copy(views[view].target);}schedule();drawOnce();}
    if(event.target.closest('.factory-pause')){paused=!paused;pauseButton.setAttribute('aria-pressed',String(paused));pauseButton.textContent=paused?'Harakatni davom ettirish':'Harakatni to‘xtatish';schedule();}
  };
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();};
  const changeMotion=()=>{cancelAnimationFrame(frame);frame=0;if(pauseButton)pauseButton.hidden=motion.matches;schedule();};
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)schedule();else{cancelAnimationFrame(frame);frame=0;}},{threshold:.01});
  const sizing=new ResizeObserver(resize);sizing.observe(host);observer.observe(host);
  story.addEventListener('click',onClick);document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',changeMotion);
  if(state==='after')animateAfter(motion.matches?STAGE_SECONDS*1.3:0);
  host.classList.add('is-ready');if(pauseButton)pauseButton.hidden=motion.matches;resize();
  window.addEventListener('pagehide',function dispose(event){
    if(event.persisted)return;dead=true;cancelAnimationFrame(frame);observer.disconnect();sizing.disconnect();
    story.removeEventListener('click',onClick);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',changeMotion);
    const geometries=new Set([unitBox,...cylinders.values(),limbGeometry,headGeometry,ringGeometry]),materials=new Set();scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());env.dispose();renderer.dispose();
    window.removeEventListener('pagehide',dispose);
  });
}
