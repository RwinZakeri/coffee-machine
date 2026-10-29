import { Box3, Mesh, type Object3D } from "three";
import { MACHINE } from "../data/machineConfig";

/** Include parked incoming components before they become visible, so fitting is continuous. */
export function measureAssemblyBounds(assembly: Object3D | undefined, bounds = new Box3(), meshBounds = new Box3()) {
  bounds.min.fromArray(MACHINE.bounds.min); bounds.max.fromArray(MACHINE.bounds.max);
  if (!assembly) return bounds;
  assembly.updateWorldMatrix(true, true);
  assembly.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    if (object.geometry.boundingBox) bounds.union(meshBounds.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld));
  });
  return bounds;
}
