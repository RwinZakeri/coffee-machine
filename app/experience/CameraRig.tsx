import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box3, PerspectiveCamera, Vector3 } from "three";
import type { Object3D } from "three";
import { evaluateCameraState, smoothstep } from "./scroll/assemblyMath";
import { measureAssemblyBounds } from "./geometry/assemblyBounds";
import { CHAPTERS } from "./data/chapters";
import { progressController } from "./scroll/progress";

export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, scene, size, invalidate, gl } = useThree();
  const scratch = useMemo(() => ({
    bounds: new Box3(), meshBounds: new Box3(), target: new Vector3(),
    direction: new Vector3(), right: new Vector3(), up: new Vector3(), corner: new Vector3(),
  }), []);

  useEffect(() => progressController.subscribe(() => invalidate()), [invalidate, reducedMotion]);

  useEffect(() => {
    const host = gl.domElement.closest(".experience");
    if (!host) return;
    // DOM copy and the Canvas have separate React roots. Measure again after
    // chapter/final copy commits, and when fonts or responsive layout resize it.
    const resize = new ResizeObserver(() => invalidate());
    const refresh = () => {
      resize.disconnect();
      host.querySelectorAll(".chapter-copy, .final-copy, .experience-footer").forEach((element) => resize.observe(element));
      invalidate();
    };
    const mutations = new MutationObserver(refresh);
    mutations.observe(host, { childList: true });
    refresh();
    return () => { mutations.disconnect(); resize.disconnect(); };
  }, [gl, invalidate]);

  // Fit after progress subscribers apply all part transforms, including direct
  // jumps. This avoids framing a previous pose when scrolling in either direction.
  useFrame(() => {
    const portrait = size.width < 700 || size.height > size.width;
    const progress = progressController.get();
    const pose = evaluateCameraState(progress, CHAPTERS, { reducedMotion });
    const { bounds, meshBounds, target, direction, right, up, corner } = scratch;
    target.set(...pose.target);
    direction.set(...pose.position).sub(target);
    let distance = direction.length();
    direction.normalize();

    if (camera instanceof PerspectiveCamera) {
      let assembly: Object3D | undefined = scene.getObjectByName("Custom_Espresso_Unit");
      if (!assembly) scene.traverse((object) => {
        if (!assembly && object.userData.machineAssembly === true) assembly = object;
      });
      measureAssemblyBounds(assembly, bounds, meshBounds);

      const fov = portrait ? 37 : pose.fov;
      const tangentY = Math.tan(fov * Math.PI / 360);
      const tangentX = tangentY * size.width / Math.max(1, size.height);
      right.set(direction.z, 0, -direction.x).normalize();
      up.crossVectors(direction, right).normalize();

      // Reserve the actual copy/footer area in portrait, including the taller
      // final product title. A fixed optical center can overlap copy on short screens.
      const centerX = portrait ? 0 : 0.3;
      let centerY = portrait ? -0.36 : 0;
      const safeX = portrait ? [-0.84, 0.84] : [-0.12, 0.84];
      let safeY = portrait ? [-0.8, 0.08] : [-0.74, 0.74];
      if (portrait) {
        const copy = document.querySelector<HTMLElement>(".chapter-copy");
        const finalCopy = document.querySelector<HTMLElement>(".final-copy");
        const footer = document.querySelector<HTMLElement>(".experience-footer");
        const bottom = Math.min(size.height * .92, (footer?.getBoundingClientRect().top ?? size.height) - size.height * .025);
        // Layout offsets exclude the copy's decorative entrance transform.
        const chapterBottom = copy ? copy.offsetTop + copy.offsetHeight : size.height * .38;
        const finalBottom = finalCopy ? finalCopy.offsetTop + finalCopy.offsetHeight : chapterBottom;
        const reveal = smoothstep((progress - .94) / .05);
        const copyBottom = chapterBottom + (finalBottom - chapterBottom) * reveal;
        const top = Math.min(Math.max(size.height * .38, copyBottom + size.height * .025), bottom - size.height * .12);
        safeY = [1 - 2 * bottom / size.height, 1 - 2 * top / size.height];
        centerY = (safeY[0] + safeY[1]) / 2;
      }
      for (let index = 0; index < 8; index += 1) {
        corner.set(
          index & 1 ? bounds.max.x : bounds.min.x,
          index & 2 ? bounds.max.y : bounds.min.y,
          index & 4 ? bounds.max.z : bounds.min.z,
        ).sub(target);
        const x = corner.dot(right), y = corner.dot(up), z = corner.dot(direction);
        const horizontalRoom = x < 0 ? centerX - safeX[0] : safeX[1] - centerX;
        const verticalRoom = y < 0 ? centerY - safeY[0] : safeY[1] - centerY;
        distance = Math.max(distance, z + Math.abs(x) / (tangentX * horizontalRoom), z + Math.abs(y) / (tangentY * verticalRoom), z + 0.06);
      }
      camera.fov = fov;
      camera.aspect = size.width / Math.max(1, size.height);
      camera.setViewOffset(size.width, size.height, portrait ? 0 : -size.width * 0.15, portrait ? size.height * centerY / 2 : 0, size.width, size.height);
      camera.updateProjectionMatrix();
    }

    camera.position.copy(direction.multiplyScalar(distance).add(target));
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    // A public projected frame lets browser checks verify the actual camera
    // composition without depending on private React Three Fiber internals.
    const frame = [Infinity, Infinity, -Infinity, -Infinity];
    for (let index = 0; index < 8; index++) {
      corner.set(index & 1 ? bounds.max.x : bounds.min.x, index & 2 ? bounds.max.y : bounds.min.y, index & 4 ? bounds.max.z : bounds.min.z).project(camera);
      const x = (corner.x + 1) * size.width / 2;
      const y = (1 - corner.y) * size.height / 2;
      frame[0] = Math.min(frame[0], x); frame[1] = Math.min(frame[1], y);
      frame[2] = Math.max(frame[2], x); frame[3] = Math.max(frame[3], y);
    }
    gl.domElement.dataset.subjectBounds = JSON.stringify(frame);
    gl.domElement.dataset.cameraPose = JSON.stringify([...camera.position.toArray(), ...camera.quaternion.toArray()]);
    gl.domElement.dataset.renderedProgress = String(progress);
  });
  return null;
}
