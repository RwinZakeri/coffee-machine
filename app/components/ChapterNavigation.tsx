import { CHAPTERS } from "../experience/data/chapters";
import { navigateToProgress } from "../experience/scroll/progress";

export function ChapterNavigation({ active, reducedMotion, expanded, onToggle }: { active: number; reducedMotion: boolean; expanded: boolean; onToggle: () => void }) {
  return <nav className={`chapter-navigation ${expanded ? "expanded" : ""}`} aria-label="Assembly chapters">
    <button className="chapter-toggle" onClick={onToggle} aria-expanded={expanded}><span className="micro">CHAPTERS</span><span>{expanded ? "−" : "+"}</span></button>
    <ol>{CHAPTERS.map((chapter, index) => <li key={chapter.id}><button onClick={() => navigateToProgress(chapter.end - 0.002, reducedMotion)} aria-current={active === index ? "step" : undefined} title={chapter.title}><span className="chapter-dot" /><span className="chapter-number">{String(index + 1).padStart(2, "0")}</span><span className="chapter-name">{chapter.title}</span></button></li>)}</ol>
    <span className="mobile-chapter micro">{active < 0 ? "00" : String(active + 1).padStart(2, "0")} / 11</span>
  </nav>;
}
