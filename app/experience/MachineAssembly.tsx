import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import type { LoadedAssets } from "./assets/loadMachineAssets";
import { prepareMachineAssembly } from "./assets/prepareMachineAssembly";
import { buildPartsManifest } from "./data/partsManifest";
import { createAssemblyTimeline } from "./scroll/AssemblyTimeline";
import { progressController } from "./scroll/progress";
import { chapterAtProgress } from "./scroll/assemblyMath";
import { CHAPTERS } from "./data/chapters";

export function MachineAssembly({ assets, reducedMotion }: { assets: LoadedAssets; reducedMotion: boolean }) {
  const { invalidate } = useThree();
  const prepared = useMemo(() => prepareMachineAssembly(assets.model.scene, buildPartsManifest(assets.index)), [assets]);
  useEffect(() => {
    const director = createAssemblyTimeline(prepared.specs, prepared.objects);
    const unsubscribe = progressController.subscribe((progress) => {
      const presentationProgress = reducedMotion && progress >= CHAPTERS[0].start ? chapterAtProgress(progress, CHAPTERS).chapter.end : progress;
      director.seek(presentationProgress); invalidate();
    });
    return () => { unsubscribe(); director.dispose(); };
  }, [prepared, invalidate, reducedMotion]);
  // Imported geometry/materials are shared with the loaded asset and disposed there.
  return <primitive object={prepared.root} dispose={null} />;
}
