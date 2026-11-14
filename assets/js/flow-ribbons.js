import { Group, Mesh, Points, PlaneGeometry, BufferGeometry, Float32BufferAttribute, ShaderMaterial, Color, Vector2, Vector4, DoubleSide, AdditiveBlending, NormalBlending } from 'three';

// Silk-like data streams: translucent threaded ribbons sweep across the page and
// particles travel along them. Everything moves in the vertex shader (no per-frame
// buffer uploads). The center column is dimmed so text stays calm.
const RIBBONS = [
  // shape: base y, slope, amplitude, frequency · motion: phase, speed, width, twist
  { shape: [-.42, .34, .16, 1.35], motion: [0, .16, .62, 1.1], dark: [0x10b981, 0x6ee7b7], light: [0x047857, 0x0d9488] },
  { shape: [.38, -.26, .14, 1.05], motion: [2.1, .12, .5, -.9], dark: [0x14b8a6, 0x38bdf8], light: [0x0f766e, 0x0369a1] },
  { shape: [.05, .12, .22, .8], motion: [4.2, .1, .78, .7], dark: [0x10b981, 0xa78bfa], light: [0x047857, 0x6d28d9] },
  { shape: [-.7, -.08, .1, 1.7], motion: [1.3, .2, .34, 1.6], dark: [0xf59e0b, 0x10b981], light: [0xb45309, 0x047857] },
];

const PATH = `
uniform float uTime;uniform float uScroll;uniform vec2 uBounds;uniform vec2 uPointer;uniform float uCompact;
uniform vec4 uShape[4];uniform vec4 uMotion[4];
vec3 ribbonPoint(int i,float u,float v,out float shade,out float sx,out float vis){
  vec4 s=uShape[i];vec4 m=uMotion[i];
  float x=mix(-1.35,1.35,u);
  float t=uTime*m.y+m.x+uScroll*.4;
  // Scroll drops each ribbon from the top; near the bottom it flattens, pleats and
  // settles onto a neat stack, then fades while the next one falls in.
  float fall=fract(float(i)*.25+s.x*.04+uScroll*.32);
  float settle=smoothstep(.56,.84,fall);
  float landing=sin(clamp((fall-.56)/.28,0.,1.)*3.14159)*.06;
  float amp=s.z*(1.-settle*.92);
  float flowY=mix(1.25,-.55,fall)+s.y*x*(1.-settle)+amp*(sin(x*s.w+t)+.45*sin(x*s.w*2.1-t*1.3+m.x));
  float stackY=-.74+float(i)*.07+.025*sin(x*14.+float(i)*1.7)*settle-landing;
  float y=mix(flowY,stackY,settle);
  y*=mix(1.,.85,uCompact);
  float twist=mix(m.w*x+t*.6,1.5708+.35*sin(x*9.+float(i)),settle);
  float across=(v-.5)*m.z*mix(1.,.7,uCompact)*mix(1.,.55,settle);
  vec3 p=vec3(x*uBounds.x,y*uBounds.y+cos(twist)*across,-1.3+sin(twist)*across*1.6*(1.-settle*.7)+.35*sin(x*2.+t)*(1.-settle));
  vec2 d=p.xy/uBounds-uPointer*2.;
  p.z+=exp(-dot(d,d)*3.5)*.7;
  shade=mix(.5+.5*cos(twist),.75+.25*sin(x*14.+float(i)*1.7),settle);
  sx=x;
  vis=smoothstep(0.,.12,fall)*(1.-smoothstep(.9,1.,fall));
  return p;
}
float centerFade(float x){return mix(.2,1.,smoothstep(.12,.78,abs(x)));}
`;

export function createFlowRibbons(parent, quality) {
  const root = new Group();
  parent.add(root);
  const colorsA = RIBBONS.map(r => new Color(r.dark[0]));
  const colorsB = RIBBONS.map(r => new Color(r.dark[1]));
  const uniforms = {
    uTime: { value: 0 }, uScroll: { value: 0 }, uDark: { value: 1 }, uCompact: { value: 0 },
    uBounds: { value: new Vector2(5, 3.2) }, uPointer: { value: new Vector2() }, uPixelRatio: { value: 1 },
    uShape: { value: RIBBONS.map(r => new Vector4(...r.shape)) },
    uMotion: { value: RIBBONS.map(r => new Vector4(...r.motion)) },
    uColorA: { value: colorsA }, uColorB: { value: colorsB },
  };
  const tier = quality.tier;
  const segments = tier === 'high' ? [220, 30] : tier === 'mid' ? [150, 20] : [90, 12];
  const sheetGeometry = new PlaneGeometry(1, 1, ...segments);
  const materials = [];
  const sheets = RIBBONS.map((_, index) => {
    const material = new ShaderMaterial({
      uniforms: { ...uniforms, uIndex: { value: index } },
      transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending, toneMapped: false,
      vertexShader: `${PATH}uniform int uIndex;varying vec2 vUv;varying float vShade;varying float vX;varying float vVis;
        void main(){float sh,sx,vis;vec3 p=ribbonPoint(uIndex,uv.x,uv.y,sh,sx,vis);vUv=uv;vShade=sh;vX=sx;vVis=vis;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader: `uniform int uIndex;uniform vec3 uColorA[4];uniform vec3 uColorB[4];uniform float uDark;uniform float uTime;
        varying vec2 vUv;varying float vShade;varying float vX;varying float vVis;
        float centerFade(float x){return mix(.2,1.,smoothstep(.12,.78,abs(x)));}
        void main(){
          float thread=pow(1.-abs(fract(vUv.y*30.)-.5)*2.,7.);
          float pulse=pow(.5+.5*sin((vUv.x*3.-uTime*.09-float(uIndex)*.31)*6.2832),10.);
          float edge=sin(vUv.y*3.14159);
          edge*=edge;
          float ends=smoothstep(0.,.14,vUv.x)*smoothstep(1.,.86,vUv.x);
          float rim=smoothstep(.0,.08,vUv.y)*smoothstep(1.,.92,vUv.y)*(1.-smoothstep(.04,.18,min(vUv.y,1.-vUv.y)));
          float body=(.1+thread*.55+pulse*.55)*edge+rim*.5;
          vec3 color=mix(uColorA[uIndex],uColorB[uIndex],smoothstep(.1,.9,vUv.x))*(.65+.7*vShade);
          float alpha=body*ends*vVis*centerFade(vX)*(.35+.65*vShade)*mix(.7,.62,uDark);
          gl_FragColor=vec4(color,alpha);
          #include <colorspace_fragment>
        }`,
    });
    materials.push(material);
    const mesh = new Mesh(sheetGeometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = -5 + index;
    root.add(mesh);
    return mesh;
  });

  const particleMaterial = new ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false,
    vertexShader: `${PATH}uniform float uPixelRatio;uniform vec3 uColorA[4];uniform vec3 uColorB[4];
      attribute float aRibbon;attribute float aSeed;attribute float aV;attribute float aSize;
      varying vec3 vColor;varying float vAlpha;
      void main(){
        int i=int(aRibbon+.5);
        float speed=.012+.018*fract(aSeed*7.13);
        float u=fract(aSeed+uTime*speed);
        float sh,sx,vis;vec3 p=ribbonPoint(i,u,aV,sh,sx,vis);
        p.z+=(fract(aSeed*31.7)-.5)*.5;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=aSize*uPixelRatio*(10./-mv.z);
        vColor=mix(uColorA[i],uColorB[i],u);
        float ends=smoothstep(0.,.1,u)*smoothstep(1.,.9,u);
        float twinkle=.55+.45*sin(aSeed*90.+uTime*(1.2+fract(aSeed*13.)*1.5));
        vAlpha=ends*vis*centerFade(sx)*twinkle*(.45+.55*sh);
      }`,
    fragmentShader: `uniform float uDark;varying vec3 vColor;varying float vAlpha;
      void main(){
        float r=length(gl_PointCoord-.5);
        if(r>.5)discard;
        float core=1.-smoothstep(.0,.5,r);
        gl_FragColor=vec4(vColor,core*core*vAlpha*mix(.8,1.,uDark));
        #include <colorspace_fragment>
      }`,
  });
  materials.push(particleMaterial);
  const particles = new Points(new BufferGeometry(), particleMaterial);
  particles.frustumCulled = false;
  root.add(particles);

  let compactField = null;
  const buildParticles = compact => {
    const base = tier === 'high' ? 3000 : tier === 'mid' ? 1700 : 800;
    const count = Math.round(base * (compact ? .55 : 1));
    const ribbon = [], seed = [], across = [], size = [], position = [];
    for (let n = 0; n < count; n++) {
      const hash = Math.sin(n * 12.9898) * 43758.5453, r = hash - Math.floor(hash);
      const hash2 = Math.sin(n * 78.233) * 12543.123, r2 = hash2 - Math.floor(hash2);
      ribbon.push(n % RIBBONS.length);
      seed.push(r);
      // Most particles follow the threads; some drift around the ribbon as dust.
      across.push(r2 < .8 ? .1 + r2 / .8 * .8 : -.6 + (r2 - .8) / .2 * 2.2);
      size.push(r2 < .8 ? 1.4 + r * 2.2 : 2.2 + r * 3.2);
      position.push(0, 0, 0);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
    geometry.setAttribute('aRibbon', new Float32BufferAttribute(ribbon, 1));
    geometry.setAttribute('aSeed', new Float32BufferAttribute(seed, 1));
    geometry.setAttribute('aV', new Float32BufferAttribute(across, 1));
    geometry.setAttribute('aSize', new Float32BufferAttribute(size, 1));
    particles.geometry.dispose();
    particles.geometry = geometry;
  };

  let scroll = 0;
  return {
    resize(halfWidth, halfHeight, width) {
      uniforms.uBounds.value.set(halfWidth, halfHeight);
      const compact = width < 700;
      uniforms.uCompact.value = compact ? 1 : 0;
      // A phone shows fewer ribbons; the last one becomes optional.
      sheets[3].visible = !compact || tier === 'high';
      if (compact !== compactField) { compactField = compact; buildParticles(compact); }
    },
    theme(dark) {
      uniforms.uDark.value = dark ? 1 : 0;
      RIBBONS.forEach((r, i) => { colorsA[i].setHex(dark ? r.dark[0] : r.light[0]); colorsB[i].setHex(dark ? r.dark[1] : r.light[1]); });
      // Additive light only glows on dark backgrounds; light pages use ordinary blending.
      materials.forEach(material => { material.blending = dark ? AdditiveBlending : NormalBlending; material.needsUpdate = true; });
    },
    pixelRatio(ratio) { uniforms.uPixelRatio.value = ratio; },
    update(time, pointerX, pointerY, scrollRatio) {
      scroll += (scrollRatio - scroll) * .06;
      uniforms.uTime.value = time;
      uniforms.uScroll.value = scroll;
      const pointer = uniforms.uPointer.value;
      pointer.x += (pointerX - pointer.x) * .05;
      pointer.y += (-pointerY - pointer.y) * .05;
    },
  };
}
