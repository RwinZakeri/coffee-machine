import {
  CircleGeometry, CylinderGeometry, ExtrudeGeometry, Group, InstancedMesh, LatheGeometry,
  Matrix4, Mesh, MeshStandardMaterial, Object3D, Path, Shape, Vector2,
} from "three";
import { BREW_GROUP_ELEMENTS, brewGroupPartId } from "../data/reconstructedParts";
import type { BrewGroupElement } from "../data/reconstructedParts";

const SEGMENTS = 80;

/** Cross-sections are in meters. Only nominal dimensions named in source notes are measured facts. */
function revolved(points: readonly (readonly [number, number])[]) {
  return new LatheGeometry(points.map(([radius, y]) => new Vector2(radius, y)), SEGMENTS);
}

function annulus(outer: number, inner: number, height: number) {
  return revolved([[inner, -height /2], [outer, -height /2], [outer, height /2], [inner, height /2], [inner, -height /2]]);
}

function bayonetGeometry() {
  const shape = new Shape(); shape.absarc(0, 0, .0495, 0, Math.PI *2, false);
  const opening = new Path();
  // Two opposed entry recesses communicate the documented bayonet relationship.
  // The contour is deliberately classified as an inferred profile in the manifest.
  for (let i = SEGMENTS; i >= 0; i--) {
    const angle = i /SEGMENTS *Math.PI *2;
    const distanceToEntry = Math.min(Math.abs(Math.sin(angle)), 1);
    const radius = distanceToEntry < .25 ? .041 : .0335;
    const x = Math.cos(angle) *radius; const y = Math.sin(angle) *radius;
    if (i === SEGMENTS) opening.moveTo(x, y); else opening.lineTo(x, y);
  }
  opening.closePath(); shape.holes.push(opening);
  // Three screw clearances are supported by the AV cap drawing; bolt circle is inferred.
  for (let i = 0; i < 3; i++) {
    const angle = i /3 *Math.PI *2 + Math.PI /2;
    const hole = new Path(); hole.absarc(Math.cos(angle) *.043, Math.sin(angle) *.043, .0043, 0, Math.PI *2, true);
    shape.holes.push(hole);
  }
  const geometry = new ExtrudeGeometry(shape, { depth: .009, bevelEnabled: true, bevelSize: .00055, bevelThickness: .00055, bevelSegments: 2, curveSegments: 24 });
  geometry.rotateX(-Math.PI /2); geometry.translate(0, -.0045, 0);
  return geometry;
}

function mesh(geometry: Mesh["geometry"], material: MeshStandardMaterial, name: string) {
  const object = new Mesh(geometry, material); object.name = name;
  object.castShadow = true; object.receiveShadow = true;
  return object;
}

function createScreen(material: MeshStandardMaterial, dark: MeshStandardMaterial) {
  const group = new Group();
  const screen = revolved([
    [.0031, -.00325], [.0248, -.00325], [.0265, -.0017], [.0265, .00325],
    [.0258, .00325], [.0258, -.0012], [.0245, -.0026], [.0031, -.0026], [.0031, -.00325],
  ]);
  group.add(mesh(screen, material, "FormedScreen_H6_5"));
  // Flat dark insets are an illustrative perforation texture. They are not modeled fluid passages.
  const positions: [number, number][] = [];
  for (let row = -10; row <= 10; row++) {
    for (let column = -10; column <= 10; column++) {
      const x = column *.0021 + (Math.abs(row) %2) *.00105; const z = row *.00182;
      const radius = Math.hypot(x, z);
      if (radius < .0235 && radius > .0043) positions.push([x, z]);
    }
  }
  const holes = new InstancedMesh(new CircleGeometry(.00035, 6), dark, positions.length);
  const matrix = new Matrix4();
  positions.forEach(([x, z], index) => {
    matrix.makeRotationX(Math.PI /2); matrix.setPosition(x, -.00329, z); holes.setMatrixAt(index, matrix);
  });
  holes.instanceMatrix.needsUpdate = true; holes.name = "IllustrativeScreenPerforations";
  group.add(holes); return group;
}

function createDiffuserScrew(material: MeshStandardMaterial) {
  const group = new Group();
  const head = mesh(new CylinderGeometry(.005, .005, .002, 32), material, "Head_D10");
  const shaft = mesh(new CylinderGeometry(.003, .003, .009, 20), material, "Shaft_M6_InferredLength");
  shaft.position.y = .0055; group.add(head, shaft); return group;
}

function createFixingBolts(material: MeshStandardMaterial) {
  const group = new Group();
  const shaftGeometry = new CylinderGeometry(.004, .004, .052, 20);
  const headGeometry = new CylinderGeometry(.0064, .0064, .0075, 6);
  const washerGeometry = annulus(.007, .00425, .0015);
  for (let i = 0; i < 3; i++) {
    const angle = i /3 *Math.PI *2 + Math.PI /2; const x = Math.cos(angle) *.043; const z = Math.sin(angle) *.043;
    const bolt = new Group(); bolt.name = `AVCapBolt_${i +1}`; bolt.position.set(x, 0, z);
    const shaft = mesh(shaftGeometry, material, "M8x52");
    const head = mesh(headGeometry, material, "InferredSocketHead"); head.position.y = .02975;
    const washer = mesh(washerGeometry, material, "L1003_Washer_8_5x14x1_5"); washer.position.y = .02525;
    bolt.add(shaft, head, washer); group.add(bolt);
  }
  return group;
}

/** Unpositioned independent objects. The manifest owns every final/exploded transform. */
export function createBrewGroupObjects(): Map<string, Object3D> {
  const chrome = new MeshStandardMaterial({ color: "#c7c9cc", metalness: 1, roughness: .17 });
  const steel = new MeshStandardMaterial({ color: "#b5b7ba", metalness: 1, roughness: .3 });
  const gasket = new MeshStandardMaterial({ color: "#161816", metalness: 0, roughness: .75 });
  const perforation = new MeshStandardMaterial({ color: "#191b18", metalness: .1, roughness: .65 });
  const templates: Record<BrewGroupElement, Object3D> = {
    Housing: mesh(revolved([
      [.036, -.019], [.043, -.019], [.048, -.0155], [.048, .0155], [.046, .019],
      [.048, .019], [.048, .022], [.036, .022], [.036, -.019],
    ]), chrome, "InferredExposedGroupSkirt"),
    Gasket: mesh(annulus(.0358, .0275, .0082), gasket, "H_3_007_71_6x55x8_2"),
    ShowerScreen: createScreen(steel, perforation),
    DiffuserScrew: createDiffuserScrew(chrome),
    BayonetRing: mesh(bayonetGeometry(), chrome, "L109_01_InferredBayonetContour"),
    FixingBolts: createFixingBolts(steel),
  };
  const objects = new Map<string, Object3D>();
  for (const side of ["Left", "Right"] as const) {
    for (const element of BREW_GROUP_ELEMENTS) {
      const id = brewGroupPartId(side, element); const object = templates[element].clone(true); object.name = id;
      object.userData = { source: "Catalog-supported reconstruction", element, side };
      objects.set(id, object);
    }
  }
  return objects;
}
