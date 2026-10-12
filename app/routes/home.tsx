import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/home";
import { ExperienceCanvas } from "../experience/ExperienceCanvas";
import { createScrollDirector } from "../experience/scroll/ScrollDirector";
import { progressController, navigateToProgress } from "../experience/scroll/progress";
import { CHAPTERS } from "../experience/data/chapters";
import { ChapterNavigation } from "../components/ChapterNavigation";
import { SourcePanel } from "../components/SourcePanel";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Linea PB — The Anatomy of Espresso" }, { name: "description", content: "An interactive exploration of precision, pressure and engineering. Assemble the La Marzocco Linea PB AV in eleven scroll-driven chapters." }];
}

const editorial = [
  ["The foundation", "of precision.", "A rigid structure is the beginning of everything. Every system has a place. Every connection has a purpose."],
  ["Water,", "in motion.", "From the inlet to extraction, a network of valves and fittings controls the journey of water."],
  ["Pressure", "with purpose.", "The rotary pump is the pressure source. Its installation is considered separately from the machine chassis."],
  ["Two boilers.", "One balance.", "Dedicated coffee and steam boilers separate the demands of precise extraction and powerful steam."],
  ["Where water", "becomes espresso.", "Two saturated brew groups bring temperature stability to the point of extraction."],
  ["The art", "of steam.", "Independent steam valves, articulated wands and a dedicated hot-water outlet complete the barista’s working space."],
  ["Intelligence", "beneath the surface.", "Electronic controls coordinate the machine. Their detailed routing requires service geometry beyond the design CAD."],
  ["Precision,", "at your fingertips.", "Six programmable group buttons, a central display and a pressure gauge give the AV its unmistakable face."],
  ["Every detail", "has a purpose.", "Beneath the groups, the tray and grille collect the water that does not reach the cup."],
  ["Engineering", "takes form.", "The exposed assembly becomes the Linea PB. A custom black-and-white finish frames its stainless-steel details."],
  ["The final", "connection.", "Two portafilters align with the group heads. A measured twist completes the exterior assembly."],
];

const gaps: Record<string, string> = {
  "01_Frame": "Original corner members, legs and feet. The complete internal chassis is absent from the design CAD.",
  "02_Hydraulics": "Original nine-piece sight glass. The full inlet and pipe network is absent from the design CAD.",
  "03_Pump": "The external pump module is absent from the design CAD. It is not installed inside the chassis.",
  "04_Boilers": "The coffee and steam boilers, heaters and probes require service CAD or measured reconstruction.",
  "05_BrewGroups": "Catalog-based lower-stack reconstruction. Housing dimensions and hidden group details remain approximate.",
  "06_Steam": "Original wand and hot-water outlet CAD; internal valve and connecting pipe details are incomplete.",
  "07_Electronics": "Original AV control backs and connectors. The main PCB and full wiring harness are missing.",
  "08_ControlPanel": "Original control geometry. Printed gauge markings and display graphics are not included in the CAD.",
  "09_Drain": "Original basin and grille geometry. The installation drain hose is not included.",
};

export default function Home() {
  const journey = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const percent = useRef<HTMLSpanElement>(null);
  const scrubber = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(-1);
  const [final, setFinal] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
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
      setActive(index < 0 && progress >= CHAPTERS[0].start ? 10 : index);
      setFinal(progress >= 0.995);
      scene.current?.style.setProperty("--progress", String(progress));
      scene.current?.style.setProperty("--opening-opacity", String(Math.max(0, 1 - progress / 0.045)));
      if (percent.current) percent.current.textContent = `${Math.round(progress * 100).toString().padStart(2, "0")}%`;
      if (scrubber.current) scrubber.current.value = String(progress * 1000);
    });
    return () => { cleanup(); unsubscribe(); preference.removeEventListener("change", update); };
  }, []);

  const chapter = CHAPTERS[active];
  const text = editorial[active];
  return <main id="assembly-journey" ref={journey} className={`journey ${reducedMotion ? "reduced-motion" : ""}`}>
    <div className={`experience ${active >= 0 ? "has-started" : ""} ${final ? "is-final" : ""}`} ref={scene}>
      <ExperienceCanvas reducedMotion={reducedMotion} onReady={() => setReady(true)} onInventory={setAvailable} />
      <div className="ambient-grain" aria-hidden="true" />
      <header className="site-header">
        <a className="wordmark" href="#" onClick={(event) => { event.preventDefault(); navigateToProgress(0, reducedMotion); }} aria-label="La Marzocco — return to opening"><svg viewBox="0 0 38 24" aria-hidden="true"><path d="M2 20 11 4l8 12 5-8 12 12M7 20h24M11 4v5" /></svg><span>la marzocco<span className="wordmark-sub">FLORENCE, ITALY · EST. 1927</span></span></a>
        <span className="header-edition micro">LINEA PB AV <span>/</span> ANATOMY SERIES Nº 01</span>
        <button className="header-source micro" onClick={() => setSourcesOpen(true)}>THE SOURCES <span aria-hidden="true">↗</span></button>
      </header>
      <section className="opening" aria-labelledby="opening-title" aria-hidden={active >= 0} inert={active >= 0}>
        <div className="opening-eyebrow micro"><span className="tiny-line" /> PRECISION. PRESSURE. POSSIBILITY.</div>
        <h1 id="opening-title">The anatomy<br />of <em>espresso.</em></h1>
        <div className="opening-bottom"><p>An exploration of the engineering<br />behind an extraordinary cup.</p><div className="opening-spec micro">LA MARZOCCO LINEA PB<br /><span>2 GROUP / AUTOMATIC</span></div></div>
        <button className="scroll-prompt" onClick={() => navigateToProgress(0.11, reducedMotion)} disabled={!ready}><span className="scroll-track" aria-hidden="true" /><span className="micro">SCROLL TO ASSEMBLE</span><span className="scroll-arrow">↓</span></button>
        <span className="opening-side micro">AN INTERACTIVE ENGINEERING EXPLORATION</span>
      </section>
      {active >= 0 && !final && <section className="chapter-copy" key={chapter.id} aria-live="polite"><div className="micro chapter-eyebrow"><span>{String(active + 1).padStart(2, "0")}</span> / {chapter.title.toUpperCase()}</div><h2>{text[0]}<br /><em>{text[1]}</em></h2><p>{text[2]}</p><div className="chapter-evidence micro"><span className="evidence-dot" />{available[chapter.group] ? `${available[chapter.group]} INDEPENDENT 3D PARTS` : "SOURCE STUDY · CAD ASSET GAP"}</div>{gaps[chapter.group] && <p className="gap-note">{gaps[chapter.group]}</p>}</section>}
      {final && <section className="final-copy"><span className="micro">11 / AVAILABLE PARTS ASSEMBLED</span><h2>LINEA PB</h2><p className="final-tagline">Engineered<br /><em>from within.</em></p><p className="micro">2 GROUP / AUTOMATIC<br /><span>CUSTOM BLACK & WHITE</span></p><div className="final-actions"><button className="pill-button" onClick={() => navigateToProgress(0, reducedMotion)}>Replay assembly <span>↺</span></button><button className="text-link" onClick={() => navigateToProgress(0.47, reducedMotion)}>Explore internals <span>↗</span></button></div><p className="final-disclosure">Original exterior CAD and disclosed group reconstructions. Full service internals remain incomplete.</p></section>}
      <ChapterNavigation active={active} reducedMotion={reducedMotion} expanded={chaptersOpen} onToggle={() => setChaptersOpen((open) => !open)} />
      <footer className="experience-footer"><span className="micro footer-label">{active < 0 ? "FROM NOTHING. TO EXTRAORDINARY." : final ? "710 × 590 × 533 MM" : "SCROLL FORWARD TO ASSEMBLE · BACKWARD TO REVERSE"}</span><div className="assembly-progress"><label htmlFor="assembly-scrubber" className="micro">ASSEMBLY <span ref={percent}>00%</span></label><input ref={scrubber} id="assembly-scrubber" type="range" min="0" max="1000" defaultValue="0" aria-label="Assembly progress" onChange={(event) => navigateToProgress(Number(event.target.value) / 1000, true)} /></div><span className="micro footer-right">A STUDY IN EVERY DETAIL</span></footer>
    </div>
    <div className="sr-only"><h2>Assembly chapters</h2><ol>{CHAPTERS.map((entry) => <li key={entry.id}><h3>{entry.title}</h3><p>{entry.description}</p></li>)}</ol><p>Full service internals are not present in the manufacturer’s design CAD. View sources for documented gaps.</p></div>
    <SourcePanel open={sourcesOpen} onClose={() => setSourcesOpen(false)} />
  </main>;
}
