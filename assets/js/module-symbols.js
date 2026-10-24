import { Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, BoxGeometry, SphereGeometry, CapsuleGeometry, CylinderGeometry, MeshPhysicalMaterial, AmbientLight, DirectionalLight, Shape, ExtrudeGeometry, ACESFilmicToneMapping } from 'three';

// One small offscreen WebGL context draws all module symbols into local 2D canvases.
// This keeps each illustration inside its card, with normal scrolling and clipping.
export function createModuleSymbols() {
  const hosts = [...document.querySelectorAll('[data-module-symbol]')];
  if (!hosts.length) return null;
  const renderer = new WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setSize(144,144,false); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.toneMapping=ACESFilmicToneMapping; renderer.toneMappingExposure=1.2;
  const camera=new PerspectiveCamera(32,1,.1,20);
  camera.position.set(3,2.5,4.8); camera.lookAt(0,-.02,0); camera.zoom=1.3; camera.updateProjectionMatrix();
  const materials=[];
  const material=color=>{const value=new MeshPhysicalMaterial({color,metalness:.18,roughness:.32,clearcoat:.6});materials.push(value);return value;};
  const mint=material(0xc1eadb),deep=material(0x08775d),ivory=material(0xf6faf7),ink=material(0x37554b);
  const accents={wms:material(0xc78f42),erp:material(0xcf7653),hr:material(0x4b9aaa),crm:material(0x8d78bb),lms:material(0xbc7894)};
  const models=new Map();
  function modelFor(id) {
    const scene=new Scene(),root=new Group(),parts=[];
    scene.add(root,new AmbientLight(0xffffff,2.4));
    const key=new DirectionalLight(0xffffff,3.5);key.position.set(-3,5,5);scene.add(key);
    const mesh=(geometry,mat,x=0,y=0,z=0,parent=root)=>{const item=new Mesh(geometry,mat);item.position.set(x,y,z);parent.add(item);return item;};
    const box=(w,h,d,mat,x=0,y=0,z=0,parent=root)=>mesh(new BoxGeometry(w,h,d),mat,x,y,z,parent);
    const base=mesh(new CylinderGeometry(1.02,1.04,.09,48),mint,0,-.72);base.scale.z=.86;
    const accent=accents[id];
    if(id==='wms') {
      [[-.34,-.32,.18],[.34,-.32,.18],[0,.28,.03]].forEach(([x,y,z])=>{
        box(.57,.56,.57,accent,x,y,z);
        box(.09,.568,.58,ivory,x,y,z);box(.58,.012,.09,ivory,x,y+.287,z);
      });
    } else if(id==='erp') {
      box(1.68,.18,.68,ink,0,-.3);
      box(.12,.32,.48,deep,-.64,-.54);box(.12,.32,.48,deep,.64,-.54);
      for(let i=0;i<5;i++){const roller=mesh(new CylinderGeometry(.105,.105,.76,12),mint,-.65+i*.325,-.3);roller.rotation.x=Math.PI/2;}
      for(let i=0;i<2;i++){const parcel=new Group();box(.38,.38,.4,accent,0,0,0,parcel);box(.07,.39,.41,ivory,0,0,0,parcel);parcel.position.set(-.44+i*.82,0,0);root.add(parcel);parts.push(parcel);}
    } else if(id==='hr') {
      [[-.53,.18,.05],[.53,.18,.05],[0,.4,.25]].forEach(([x,y,z],i)=>{
        mesh(new SphereGeometry(.18,18,12),i===2?deep:accent,x,y+.16,z);
        mesh(new CapsuleGeometry(.19,.28,4,12),i===2?deep:mint,x,y-.32,z);
      });
    } else if(id==='crm') {
      const bubble=(mat,x,y,z)=>{
        const g=new Group();g.position.set(x,y,z);root.add(g);
        const shape=new Shape();shape.moveTo(-.46,-.22);shape.lineTo(-.46,.22);shape.quadraticCurveTo(-.46,.34,-.34,.34);shape.lineTo(.34,.34);shape.quadraticCurveTo(.46,.34,.46,.22);shape.lineTo(.46,-.14);shape.quadraticCurveTo(.46,-.26,.34,-.26);shape.lineTo(-.12,-.26);shape.lineTo(-.3,-.43);shape.lineTo(-.3,-.26);shape.lineTo(-.34,-.26);shape.quadraticCurveTo(-.46,-.26,-.46,-.22);
        mesh(new ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.035,bevelThickness:.025}),mat,0,0,0,g);
        for(let i=0;i<3;i++)mesh(new SphereGeometry(.035,10,8),ivory,-.2+i*.2,.04,.165,g);
        parts.push(g);
      };
      bubble(accent,-.2,.25,-.14);bubble(deep,.26,-.19,.18);
    } else if(id==='lms') {
      const book=new Group();root.add(book);book.position.y=-.1;
      for(const side of [-1,1]) {
        const page=new Group();page.rotation.z=side*.16;book.add(page);
        box(.7,.085,.96,accent,side*.36,-.12,0,page);
        box(.64,.11,.87,ivory,side*.34,-.025,0,page);
        for(let i=0;i<4;i++)box(.43,.012,.016,mint,side*.34,.036,-.26+i*.16,page);
        parts.push(page);
      }
      box(.07,.14,.96,deep,0,-.06);box(.075,.018,.42,deep,.48,.05,.37,book);
    }
    root.rotation.y=-.35;
    return {scene,root,parts};
  }
  const targets=hosts.map(host=>{
    const id=host.dataset.moduleSymbol;
    if(!models.has(id))models.set(id,modelFor(id));
    const canvas=document.createElement('canvas');canvas.width=renderer.domElement.width;canvas.height=renderer.domElement.height;canvas.setAttribute('aria-hidden','true');
    const context=canvas.getContext('2d');host.append(canvas);
    return {host,id,canvas,context};
  });
  let first=true,last=-Infinity,available=true,disposed=false;
  function render(time,animated) {
    if(disposed || !available || (!first && animated && time-last<.05))return;
    last=time;
    for(const [id,model] of models) {
      const visible=targets.filter(target=>{if(target.id!==id || !target.context)return false;const bounds=target.host.getBoundingClientRect();return first || (bounds.bottom>0 && bounds.top<innerHeight && bounds.right>0 && bounds.left<innerWidth);});
      if(!visible.length)continue;
      if(animated) {
        model.root.rotation.y=-.35+Math.sin(time*.45)*.1;
        if(id==='erp')model.parts.forEach((part,i)=>{part.position.x=((time*.2+i*.82)%1.64)-.82;});
        if(id==='crm')model.parts.forEach((part,i)=>{part.position.y=(i===0?.25:-.19)+Math.sin(time*.8+i)*.035;});
        if(id==='lms')model.parts.forEach((part,i)=>{part.rotation.z=(i===0?-1:1)*(.16+Math.sin(time*.65)*.025);});
      }
      renderer.render(model.scene,camera);
      visible.forEach(({host,canvas,context})=>{context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(renderer.domElement,0,0,canvas.width,canvas.height);host.classList.add('symbol-ready');});
    }
    first=false;
  }
  const lost=event=>{event.preventDefault();available=false;targets.forEach(({host})=>host.classList.remove('symbol-ready'));};
  const restored=()=>{available=true;first=true;};
  renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);
  function dispose() {
    if(disposed)return;disposed=true;
    renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);
    const geometries=new Set();models.forEach(({scene})=>scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);}));
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(mat=>mat.dispose());renderer.dispose();
    targets.forEach(({host,canvas})=>{host.classList.remove('symbol-ready');canvas.remove();});
  }
  return {render,dispose};
}
