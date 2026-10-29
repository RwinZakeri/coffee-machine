import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/home";
import { ExperienceCanvas } from "../experience/ExperienceCanvas";
import { createScrollDirector } from "../experience/scroll/ScrollDirector";
import { progressController, navigateToProgress } from "../experience/scroll/progress";
import { CHAPTERS } from "../experience/data/chapters";
import { ChapterNavigation } from "../components/ChapterNavigation";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Jaxo Coffee Machine — The Anatomy of Espresso" }, { name: "description", content: "Explore the Jaxo coffee machine through its original design. Six scroll-driven chapters reveal the structure, details and proportions of 23 components." }];
}

const editorial: Record<string, readonly [string, string, string]> = {
  "01_Frame": ["The foundation", "of an idea.", "The steel chassis and dedicated supports establish the structure of the Jaxo coffee machine."],
  "09_Drain": ["A place", "for every cup.", "The drain, grille and raised cup support shape the space beneath the group head."],
  "05_BrewGroups": ["At the heart", "of the design.", "The detailed group head and side lever give the machine its distinctive profile."],
  "08_ControlPanel": ["A clear", "point of focus.", "The display base and glass sit within the original front panel, preserving the design’s proportions."],
  "10_BodyPanels": ["Engineering", "takes form.", "The cover, side panel and fasteners complete the enclosure around the assembled structure."],
  "11_Accessories": ["The final", "connection.", "A single portafilter completes the machine and extends its silhouette toward the barista."],
};

export default function Home() {
  const journey = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const scrubber = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(-1);
  const [final, setFinal] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState<Record<string, number>>({});

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update(); preference.addEventListener("change", update);
    const cleanup = createScrollDirector(journey.current!);
    const unsubscribe = progressController.subscribe((progress) => {
      const index = progress < CHAPTERS[0].start ? -1 : CHAPTERS.findIndex((chapter) => progress <= chapter.end);
      setActive(index < 0 && progress >= CHAPTERS[0].start ? CHAPTERS.length - 1 : index);
      setFinal(progress >= 0.995);
      scene.current?.style.setProperty("--progress", String(progress));
      scene.current?.style.setProperty("--opening-opacity", String(Math.max(0, 1 - progress / 0.045)));
      if (percent.current) percent.current.textContent = `${Math.round(progress * 100).toString().padStart(2, "0")}%`;
      if (scrubber.current) scrubber.current.value = String(progress * 1000);
    });
    return () => { cleanup(); unsubscribe(); preference.removeEventListener("change", update); };
  }, []);

  const chapter = CHAPTERS[active];
  const text = chapter ? editorial[chapter.group] : undefined;
  const detailChapter = CHAPTERS.find((entry) => entry.group === "05_BrewGroups") ?? CHAPTERS[0];
  return <main id="assembly-journey" ref={journey} className={`journey ${reducedMotion ? "reduced-motion" : ""}`}>
    <div className={`experience ${active >= 0 ? "has-started" : ""} ${final ? "is-final" : ""}`} ref={scene}>
      <ExperienceCanvas reducedMotion={reducedMotion} onReady={() => setReady(true)} onInventory={setAvailable} />
      <div className="ambient-grain" aria-hidden="true" />
      <header className="site-header">
        <a className="wordmark" href="#" onClick={(event) => { event.preventDefault(); navigateToProgress(0, reducedMotion); }} aria-label="Jaxo — return to opening"><svg viewBox="0 0 38 24" aria-hidden="true"><path d="M8 20V4h22v16M8 9h22M13 13v4m12-4v4M5 20h28" /></svg><span>jaxo<span className="wordmark-sub">JAXO COFFEE MACHINE</span></span></a>
        <span className="header-edition micro">JAXO COFFEE MACHINE <span>/</span> ANATOMY SERIES Nº 01</span>
      </header>
      <section className="opening" aria-labelledby="opening-title" aria-hidden={active >= 0} inert={active >= 0}>
        <div className="opening-eyebrow micro"><span className="tiny-line" /> PRECISION. PRESSURE. POSSIBILITY.</div>
        <h1 id="opening-title">Jaxo<br /><em>coffee machine.</em></h1>
        <div className="opening-bottom"><p>An exploration of the Jaxo coffee machine,<br />one component at a time.</p><div className="opening-spec micro">JAXO COFFEE MACHINE<br /><span>23 COMPONENTS / ONE DESIGN</span></div></div>
        <button className="scroll-prompt" onClick={() => navigateToProgress(CHAPTERS[0].start + (CHAPTERS[0].end - CHAPTERS[0].start) * .6, reducedMotion)} disabled={!ready}><span className="scroll-track" aria-hidden="true" /><span className="micro">SCROLL TO ASSEMBLE</span><span className="scroll-arrow">↓</span></button>
        <span className="opening-side micro">AN INTERACTIVE ENGINEERING EXPLORATION</span>
      </section>
      {chapter && text && !final && <section className="chapter-copy" key={chapter.id} aria-live="polite"><div className="micro chapter-eyebrow"><span>{String(active + 1).padStart(2, "0")}</span> / {chapter.title.toUpperCase()}</div><h2>{text[0]}<br /><em>{text[1]}</em></h2><p>{text[2]}</p><div className="chapter-evidence micro"><span className="evidence-dot" />{available[chapter.group] ? `${available[chapter.group]} ORIGINAL COMPONENT${available[chapter.group] === 1 ? "" : "S"}` : "ORIGINAL DESIGN GEOMETRY"}</div></section>}
      <section className="final-copy" style={{ visibility: final ? "visible" : "hidden" }} aria-hidden={!final} inert={!final}><span className="micro">{String(CHAPTERS.length).padStart(2, "0")} / ORIGINAL DESIGN ASSEMBLED</span><h2>JAXO<br />COFFEE MACHINE</h2><p className="final-tagline">An idea.<br /><em>Made tangible.</em></p><p className="micro">SINGLE GROUP / CUSTOM DESIGN<br /><span>23 COMPONENTS · 56 SOLIDS</span></p><div className="final-actions"><button className="pill-button" onClick={() => navigateToProgress(0, reducedMotion)}>Replay assembly <span>↺</span></button><button className="text-link" onClick={() => navigateToProgress(detailChapter.end - .002, reducedMotion)}>Explore the details <span>↗</span></button></div></section>
      <ChapterNavigation active={active} reducedMotion={reducedMotion} expanded={chaptersOpen} onToggle={() => setChaptersOpen((open) => !open)} />
      <footer className="experience-footer"><span className="micro footer-label">{active < 0 ? "FROM AN IDEA. TO EVERY DETAIL." : final ? "251 W × 399 H × 650 D MM" : "SCROLL FORWARD TO ASSEMBLE · BACKWARD TO REVERSE"}</span><div className="assembly-progress"><label htmlFor="assembly-scrubber" className="micro">ASSEMBLY <span ref={percent}>00%</span></label><input ref={scrubber} id="assembly-scrubber" type="range" min="0" max="1000" defaultValue="0" aria-label="Assembly progress" onChange={(event) => navigateToProgress(Number(event.target.value) / 1000, true)} /></div><span className="micro footer-right">A STUDY IN EVERY DETAIL</span></footer>
    </div>
    <div className="sr-only"><h2>Assembly chapters</h2><ol>{CHAPTERS.map((entry) => <li key={entry.id}><h3>{entry.title}</h3><p>{entry.description}</p></li>)}</ol><p>The original design contains 23 components and 56 solids. The displayed dimensions include the lever and portafilter. Exploded motion illustrates the components and does not establish a manufacturing sequence.</p></div>
  </main>;
}
