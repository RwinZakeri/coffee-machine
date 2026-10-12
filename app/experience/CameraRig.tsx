import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import { evaluateCameraState } from "./scroll/assemblyMath";
import { CHAPTERS } from "./data/chapters";
import { chapterAtProgress } from "./scroll/assemblyMath";
import { progressController } from "./scroll/progress";

export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => progressController.subscribe((progress) => {
    const portrait = size.width < 700 || size.height > size.width;
    const pose = evaluateCameraState(progress, CHAPTERS, { mobile: portrait, reducedMotion });
    const chapterState = chapterAtProgress(progress, CHAPTERS);
    const currentChapter = chapterState.chapter;
    if (!portrait && ["01_Frame", "02_Hydraulics", "03_Pump", "04_Boilers", "07_Electronics"].includes(currentChapter.group)) {
      const offset = pose.position.map((value, i) => value - pose.target[i]);
      const widening = Math.sin(Math.PI * chapterState.progress) ** 2;
      const factor = 1 + (Math.max(1, 1.6 / Math.hypot(...offset)) - 1) * widening;
      pose.position = [pose.target[0] + offset[0] * factor, pose.target[1] + offset[1] * factor, pose.target[2] + offset[2] * factor];
    }
    camera.position.set(...pose.position); camera.lookAt(...pose.target);
    if (camera instanceof PerspectiveCamera) {
      camera.fov = pose.fov;
      // Keep the subject in the right-hand safe area on desktop and below copy in portrait.
      camera.setViewOffset(size.width, size.height, portrait ? 0 : -size.width * .15, portrait ? -size.height * .18 : 0, size.width, size.height);
      camera.updateProjectionMatrix();
    }
    invalidate();
  }), [camera, size, invalidate, reducedMotion]);
  return null;
}
