import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import type { Object3D, BufferGeometry, Material } from "three";
import type { LoadedAssets } from "./assets/loadMachineAssets";
import { buildPartsManifest } from "./data/partsManifest";
import { createAssemblyTimeline } from "./scroll/AssemblyTimeline";
import { progressController } from "./scroll/progress";
import { createBrewGroupObjects } from "./geometry/BrewGroupGeometry";
import { createReconstructedParts } from "./data/reconstructedParts";
import { chapterAtProgress } from "./scroll/assemblyMath";
import { CHAPTERS } from "./data/chapters";

function createMaterial(category: string) {
  if (category === "glass") return new MeshPhysicalMaterial({ color: "#e7ece7", metalness: 0, roughness: .1, transparent: true, opacity: .24, clearcoat: 1, depthWrite: false });
  const palette: Record<string, [string, number, number]> = {
    stainless: ["#b8babc", 1, .25], chrome: ["#d0d2d4", 1, .13], brass: ["#bc9557", 1, .28],
    copper: ["#b36d4d", 1, .3], rubber: ["#101110", .05, .65], black: ["#171a19", .35, .3],
    white: ["#e6e4da", .2, .25], display: ["#080d0c", .15, .16],
    "white-enamel": ["#e6e4da", .2, .25], "black-polymer": ["#111312", .05, .54], electronics: ["#151c19", .15, .46],
  };
  const [color, metalness, roughness] = palette[category] || palette.stainless;
  return new MeshStandardMaterial({ color, metalness, roughness });
}

export function MachineAssembly({ assets, reducedMotion }: { assets: LoadedAssets; reducedMotion: boolean }) {
  const { invalidate } = useThree();
  const prepared = useMemo(() => {
    const cadSpecs = buildPartsManifest(assets.index);
    const specs = [...cadSpecs, ...createReconstructedParts()];
    const objects = new Map<string, Object3D>(); const materials = new Map<string, MeshStandardMaterial>();
    const root = new Group(); root.name = "Linea_PB_AV_2_Group";
    for (const part of cadSpecs) {
      const original = assets.model.scene.getObjectByName(part.nodeName!);
      if (!original) throw new Error(`Required CAD node ${part.nodeName} is missing from the GLB.`);
      const wrapper = new Group(); wrapper.name = part.id;
      const copy = original.clone(true);
      // Meshopt quantization may introduce a static local dequantization transform.
      // Remove only the original instance placement; preserve that geometry transform.
      copy.position.x -= part.finalPosition[0]; copy.position.y -= part.finalPosition[1]; copy.position.z -= part.finalPosition[2];
      let material = materials.get(part.materialGroup);
      if (!material) { material = createMaterial(part.materialGroup); materials.set(part.materialGroup, material); }
      copy.traverse((object) => { if (object instanceof Mesh) { object.material = material!; object.castShadow = true; object.receiveShadow = true; } });
      wrapper.add(copy); root.add(wrapper); objects.set(part.id, wrapper);
    }
    const reconstructed = createBrewGroupObjects();
    reconstructed.forEach((object, id) => { root.add(object); objects.set(id, object); });
    return { root, specs, objects, materials, reconstructed };
  }, [assets]);
  useEffect(() => {
    const director = createAssemblyTimeline(prepared.specs, prepared.objects);
    const unsubscribe = progressController.subscribe((progress) => {
      const presentationProgress = reducedMotion && progress >= CHAPTERS[0].start ? chapterAtProgress(progress, CHAPTERS).chapter.end : progress;
      director.seek(presentationProgress); invalidate();
    });
    return () => { unsubscribe(); director.dispose(); };
  }, [prepared, invalidate, reducedMotion]);
  useEffect(() => () => {
    const geometries = new Set<BufferGeometry>(); const materials = new Set<Material>();
    prepared.reconstructed.forEach((object) => object.traverse((child) => {
      if (child instanceof Mesh) { geometries.add(child.geometry); (Array.isArray(child.material) ? child.material : [child.material]).forEach((material) => materials.add(material)); }
    }));
    geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose());
    prepared.materials.forEach((material) => material.dispose());
  }, [prepared]);
  return <primitive object={prepared.root} dispose={null} />;
}
