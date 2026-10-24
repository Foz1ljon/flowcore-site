import { Group, Mesh, MeshBasicMaterial, BoxGeometry, EdgesGeometry, LineSegments, LineBasicMaterial, BufferGeometry, Float32BufferAttribute, CatmullRomCurve3, Vector3, OctahedronGeometry } from 'three';

// Five connected departments, with a shared core and moving transaction packets.
// Geometry stays in the margins so the page's central reading column stays calm.
export function createFlowNetwork(parent) {
  const root = new Group();
  parent.add(root);
  const box = new BoxGeometry(.3, .3, .3);
  const outline = new EdgesGeometry(box);
  const packetGeometry = new OctahedronGeometry(.035);
  const colors = [0x10b981, 0x38bdf8, 0xf59e0b, 0xa78bfa, 0xfb7185];
  const lightColors = new Map([[0x10b981, 0x047857], [0x38bdf8, 0x0369a1], [0xf59e0b, 0xb45309], [0xa78bfa, 0x6d28d9], [0xfb7185, 0xbe123c]]);
  const materials = [];
  const material = (color, opacity, line = false) => {
    const value = new (line ? LineBasicMaterial : MeshBasicMaterial)({ color, transparent: true, opacity, depthWrite: false, toneMapped: false });
    materials.push({ value, opacity, color });
    return value;
  };
  const assemblies = [];
  for (const side of [-1, 1]) {
    const assembly = new Group();
    root.add(assembly);
    const core = new Group();
    const shell = new LineSegments(outline, material(0x10b981, .5, true));
    shell.scale.setScalar(2.1);
    core.add(shell);
    const inner = new Mesh(box, material(0x10b981, .15));
    inner.scale.setScalar(1.35);
    core.add(inner);
    assembly.add(core);
    const nodes = [], routes = [];
    for (let i = 0; i < 5; i++) {
      const angle = i / 5 * Math.PI * 2 + .25;
      const position = new Vector3(Math.cos(angle) * .95, Math.sin(angle) * 1.72, Math.sin(angle * 2) * .22);
      const node = new Group();
      node.position.copy(position);
      const fill = new Mesh(box, material(colors[i], .1));
      const edge = new LineSegments(outline, material(colors[i], .5, true));
      node.add(fill, edge);
      assembly.add(node);
      nodes.push(node);
      const curve = new CatmullRomCurve3([
        new Vector3(),
        new Vector3(position.x * .38, position.y * .15, -.24),
        new Vector3(position.x * .75, position.y * .65, -.12),
        position
      ]);
      const samples = curve.getPoints(40), segments = [];
      for (let j = 1; j < samples.length; j++) segments.push(...samples[j - 1].toArray(), ...samples[j].toArray());
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(segments, 3));
      assembly.add(new LineSegments(geometry, material(colors[i], .22, true)));
      const packets = Array.from({ length: 2 }, () => {
        const packet = new Mesh(packetGeometry, material(colors[i], .72));
        assembly.add(packet);
        return packet;
      });
      routes.push({ curve, packets });
    }
    assemblies.push({ assembly, core, nodes, routes, side });
  }
  let compact = false;
  return {
    resize(halfWidth, halfHeight, width) {
      compact = width < 700;
      for (const { assembly, side } of assemblies) {
        assembly.position.set(side * halfWidth * (compact ? .97 : .84), side * -.12, -.15);
        assembly.scale.setScalar(Math.min(1, halfHeight / 3) * (compact ? .58 : 1));
      }
    },
    theme(dark) {
      materials.forEach(({ value, opacity, color }) => {
        value.color.setHex(dark ? color : lightColors.get(color));
        value.opacity = Math.min(1, opacity * (dark ? 1 : 1.35));
      });
    },
    update(time) {
      for (const { assembly, core, nodes, routes, side } of assemblies) {
        assembly.rotation.y = side * .2 + Math.sin(time * .12 + side) * .12;
        assembly.position.y = Math.sin(time * .18 + side) * .1;
        core.rotation.set(time * .1, time * .15, .2);
        nodes.forEach((node, i) => node.rotation.set(.25 + time * .07, time * .1 + i, .15));
        routes.forEach(({ curve, packets }, i) => {
          packets.forEach((packet, j) => {
            packet.visible = !compact || j === 0;
            const progress = (time * .12 + i * .19 + j * .5) % 1;
            curve.getPoint(i % 2 ? 1 - progress : progress, packet.position);
          });
        });
      }
    }
  };
}
