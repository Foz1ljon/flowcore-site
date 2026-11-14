import { Group, Mesh, SphereGeometry, CylinderGeometry, CapsuleGeometry, Shape, ExtrudeGeometry } from 'three';

// Small studio portraits with human proportions, skin, facial features and clothing.
// The caller owns the materials; normal scene traversal disposes every geometry.
export function createTeamModel(material) {
  const team = new Group();
  const shirt = material(0xf2f0e9, 0, .8);
  const eyes = material(0x29231f, 0, .65);
  const profiles = [
    {x: -.46, y: -.04, z: -.12, skin: 0xc78e69, hair: 0x30251e, suit: 0x536d7c, turn: .16},
    {x: .46, y: -.04, z: -.12, skin: 0xe0ad88, hair: 0x463026, suit: 0x667468, turn: -.16, longHair: true},
    {x: 0, y: -.01, z: .22, skin: 0xd9a07a, hair: 0x29231e, suit: 0x253f52, turn: -.08},
  ];
  for (const profile of profiles) {
    const person = new Group();
    person.position.set(profile.x, profile.y, profile.z);
    person.rotation.y = profile.turn;
    team.add(person);
    const skin = material(profile.skin, 0, .72);
    const hair = material(profile.hair, 0, .85);
    const suit = material(profile.suit, 0, .88);
    const lips = material(0x996658, 0, .8);
    const add = (geometry, mat, x, y, z, scale) => {
      const mesh = new Mesh(geometry, mat);
      mesh.position.set(x, y, z);
      if (scale) mesh.scale.set(...scale);
      mesh.castShadow = mesh.receiveShadow = true;
      person.add(mesh);
      return mesh;
    };
    const ellipsoid = (mat, x, y, z, sx, sy, sz) => add(new SphereGeometry(1, 24, 18), mat, x, y, z, [sx, sy, sz]);
    // Blazer shoulders and upper body; the head is about a quarter of the bust height.
    ellipsoid(suit, 0, -.28, 0, .245, .31, .14);
    for (const side of [-1, 1]) {
      const arm = add(new CapsuleGeometry(.072, .25, 4, 12), suit, side * .225, -.34, 0);
      arm.rotation.z = side * .12;
    }
    add(new CylinderGeometry(.057, .066, .13, 20), skin, 0, .045, .015);
    ellipsoid(skin, 0, .235, .015, .111, .155, .107);
    ellipsoid(skin, 0, .147, .036, .082, .073, .078);
    for (const side of [-1, 1]) {
      ellipsoid(skin, side * .108, .222, .012, .022, .036, .023);
      ellipsoid(shirt, side * .041, .254, .112, .028, .013, .009);
      ellipsoid(eyes, side * .04, .254, .12, .01, .011, .005);
      const brow = ellipsoid(hair, side * .041, .277, .111, .03, .005, .006);
      brow.rotation.z = side * -.07;
    }
    ellipsoid(skin, 0, .222, .12, .017, .033, .025);
    ellipsoid(lips, 0, .174, .108, .029, .005, .007);
    // A fitted scalp cap leaves the face exposed; separate sides shape the haircut.
    add(new SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, 1.38), hair, 0, .252, .009, [.117, .147, .111]);
    for (const side of [-1, 1]) ellipsoid(hair, side * .102, .284, -.008, .018, .061, .075);
    if (profile.longHair) ellipsoid(hair, 0, .187, -.066, .125, .184, .065);
    const fringe = ellipsoid(hair, -.028, .351, .061, .084, .031, .054);
    fringe.rotation.z = -.16;
    // White shirt and two tailored lapels remain readable at miniature sizes.
    for (const side of [-1, 1]) {
      const shape = new Shape();
      shape.moveTo(side * .015, .025);
      shape.lineTo(side * .096, -.045);
      shape.lineTo(side * .025, -.22);
      shape.closePath();
      add(new ExtrudeGeometry(shape, {depth: .009, bevelEnabled: false}), shirt, 0, 0, .133);
    }
    const tie = add(new CapsuleGeometry(.013, .13, 2, 8), suit, 0, -.13, .154);
    tie.rotation.z = -.025;
  }
  return team;
}
