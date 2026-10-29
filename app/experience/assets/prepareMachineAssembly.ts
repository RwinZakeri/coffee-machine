import { Group, Mesh, type Object3D } from "three";
import type { PartSpec } from "../types";

/** Keep the imported hierarchy; identity wrappers preserve every local bind matrix. */
export function prepareMachineAssembly(scene: Group, specs: readonly PartSpec[]) {
  const root = scene.clone(true);
  root.name = "Custom_Espresso_Assembly";
  root.userData.machineAssembly = true;
  const objects = new Map<string, Object3D>();
  const used = new Set<Object3D>();
  for (const spec of specs) {
    const node = spec.nodeName ? root.getObjectByName(spec.nodeName) : undefined;
    if (!node?.parent || used.has(node)) throw new Error(`Missing or repeated custom CAD component: ${spec.nodeName}.`);
    used.add(node);
    const wrapper = new Group();
    wrapper.name = `motion_${spec.id}`;
    // An identity parent keeps the original bind, including static dequantization transforms.
    node.parent.add(wrapper);
    wrapper.add(node);
    node.traverse((child) => {
      if (child instanceof Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        child.castShadow = materials.every((material) => !material.transparent);
        child.receiveShadow = true;
      }
    });
    objects.set(spec.id, wrapper);
  }
  root.updateMatrixWorld(true);
  return { root, specs, objects };
}
