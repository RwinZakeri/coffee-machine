import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Color } from "three";
import type { AmbientLight, DirectionalLight } from "three";
import { progressController } from "./scroll/progress";
import { evaluateSceneState } from "./scroll/assemblyMath";
import { CHAPTERS } from "./data/chapters";

export function LightingRig() {
  const ambient = useRef<AmbientLight>(null); const key = useRef<DirectionalLight>(null); const rim = useRef<DirectionalLight>(null);
  const { scene, invalidate } = useThree();
  useEffect(() => {
    const background = new Color(); scene.background = background;
    return progressController.subscribe((progress) => {
      const state = evaluateSceneState(progress, CHAPTERS);
      background.set(state.palette.background);
      if (ambient.current) ambient.current.intensity = state.lighting.ambient;
      if (key.current) { key.current.intensity = state.lighting.key; key.current.color.set(state.lighting.keyColor); }
      if (rim.current) { rim.current.intensity = state.lighting.rim; rim.current.color.set(state.lighting.rimColor); }
      scene.environmentIntensity = state.lighting.environment;
      const container = document.querySelector<HTMLElement>(".experience");
      container?.style.setProperty("--foreground", state.palette.foreground);
      container?.style.setProperty("--accent", state.palette.accent);
      invalidate();
    });
  }, [scene, invalidate]);
  return <>
    <ambientLight ref={ambient} intensity={.32} />
    <directionalLight ref={key} position={[1.2, 2.3, 1.6]} intensity={3.7} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-1.2} shadow-camera-right={1.2} shadow-camera-top={1.2} shadow-camera-bottom={-1.2} shadow-bias={-.0002} shadow-normalBias={.002} />
    <directionalLight ref={rim} position={[-1.5, .9, -.7]} intensity={4.2} color="#fff3da" />
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={6} color="#fff7e8" position={[-1, 2, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[3, 2, 1]} />
      <Lightformer form="rect" intensity={3} position={[0, .4, 2]} scale={[2, .15, 1]} />
      <Lightformer form="rect" intensity={5} position={[2, 1, -.5]} rotation={[0, -Math.PI / 2, 0]} scale={[.7, 2, 1]} />
      <Lightformer form="rect" intensity={2} position={[-2, .8, -1]} rotation={[0, Math.PI / 2, 0]} scale={[1, 1.5, 1]} />
    </Environment>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.008, 0]} receiveShadow><planeGeometry args={[20, 20]} /><shadowMaterial transparent opacity={.16} depthWrite={false} /></mesh>
  </>;
}
