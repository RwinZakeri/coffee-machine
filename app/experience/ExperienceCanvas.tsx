import { Component, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { ACESFilmicToneMapping, PCFShadowMap } from "three";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { loadMachineAssets, disposeMachineAssets } from "./assets/loadMachineAssets";
import type { LoadedAssets } from "./assets/loadMachineAssets";
import { buildPartsManifest } from "./data/partsManifest";
import { MachineAssembly } from "./MachineAssembly";
import { CameraRig } from "./CameraRig";
import { LightingRig } from "./LightingRig";
import { LoadingScreen } from "../components/LoadingScreen";

function ContextGuard({ onLoss }: { onLoss: () => void }) {
  const { gl, invalidate, setDpr } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onLoss(); };
    const restored = () => invalidate();
    canvas.addEventListener("webglcontextlost", lost); canvas.addEventListener("webglcontextrestored", restored);
    return () => { canvas.removeEventListener("webglcontextlost", lost); canvas.removeEventListener("webglcontextrestored", restored); };
  }, [gl, invalidate, onLoss]);
  return <PerformanceMonitor flipflops={3} onDecline={() => setDpr(1)} onFallback={() => setDpr(1)} />;
}

class SceneBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  render() { return this.state.error ? <div className="scene-error" role="alert"><h2>The 3D scene could not start.</h2><p>{this.state.error}</p><p>Your browser must support WebGL 2.</p></div> : this.props.children; }
}

export function ExperienceCanvas({ reducedMotion, onReady, onInventory }: { reducedMotion: boolean; onReady: () => void; onInventory: (inventory: Record<string, number>) => void }) {
  const [assets, setAssets] = useState<LoadedAssets | null>(null);
  const [bytes, setBytes] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState<string>(); const [attempt, setAttempt] = useState(0);
  const [mobile, setMobile] = useState(false); const callbacks = useRef({ onReady, onInventory });
  callbacks.current = { onReady, onInventory };
  useEffect(() => {
    const query = matchMedia("(max-width: 700px), (max-width: 900px) and (orientation: portrait)"); const update = () => setMobile(query.matches);
    update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const controller = new AbortController(); let loaded: LoadedAssets | undefined;
    setError(undefined); setBytes({ loaded: 0, total: 0 });
    loadMachineAssets(controller.signal, (count, total) => setBytes({ loaded: count, total })).then((result) => {
      loaded = result; if (controller.signal.aborted) return;
      const inventory: Record<string, number> = {};
      buildPartsManifest(result.index).forEach((part) => { inventory[part.group] = (inventory[part.group] || 0) + 1; });
      callbacks.current.onInventory(inventory); setAssets(result);
    }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Unknown asset loading error"); });
    return () => { controller.abort(); if (loaded) disposeMachineAssets(loaded.model); };
  }, [attempt]);
  return <div className="canvas-container" aria-label="Interactive 3D assembly of the Jaxo coffee machine">
    {assets ? <SceneBoundary><Canvas frameloop="demand" dpr={mobile ? [1, 1.2] : [1, 1.6]} shadows={{ type: PCFShadowMap }} camera={{ position: [1.2, .7, 1.7], near: .025, far: 250, fov: 32 }} gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping }} onCreated={({ gl }) => { gl.toneMappingExposure = 1.05; callbacks.current.onReady(); }} fallback={<div className="scene-error" role="alert">WebGL 2 is unavailable. The chapter text and source library remain accessible.</div>}>
      <ContextGuard onLoss={() => setError("The graphics context was lost. Retry to restore the model.")} />
      <CameraRig reducedMotion={reducedMotion} /><LightingRig /><MachineAssembly assets={assets} reducedMotion={reducedMotion} />
      {!mobile && <EffectComposer multisampling={0}><Bloom intensity={.06} luminanceThreshold={1.5} mipmapBlur /><Vignette eskil={false} offset={.25} darkness={.15} /></EffectComposer>}
    </Canvas></SceneBoundary> : null}
    {(!assets || error) && <LoadingScreen {...bytes} error={error} onRetry={() => { setAssets(null); setAttempt((value) => value + 1); }} />}
  </div>;
}
