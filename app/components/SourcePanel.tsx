import { useEffect, useRef } from "react";

const sources = [
  ["01", "Original design", "Supplied STEP file: espressu unit all parts.stp"],
  ["02", "23 components, 56 solids", "Original component separation and assembled proportions retained."],
  ["03", "A considered finish", "Materials are authored for the presentation; the source specifies no finishes."],
  ["04", "An illustrated assembly", "Exploded motion reveals the design; it is not a manufacturing sequence."],
];

export function SourcePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return <dialog className="source-dialog" ref={dialog} onCancel={onClose} onClick={(event) => { if (event.target === dialog.current) onClose(); }} aria-labelledby="source-title">
    <div className="dialog-header"><span className="micro">THE ORIGINAL DESIGN</span><button className="icon-button" onClick={onClose} aria-label="Close sources">×</button></div>
    <h2 id="source-title">From the original.</h2>
    <p className="dialog-intro">A custom espresso machine, brought into the browser directly from its supplied CAD design. The geometry was converted locally, preserving the shape and placement of its components.</p>
    <div className="source-list">{sources.map(([number, title, subtitle]) => <div className="source-entry" key={number}><span className="micro">{number}</span><span><strong>{title}</strong><small>{subtitle}</small></span></div>)}</div>
    <p className="source-note">Overall dimensions: 251 mm wide × 399 mm high × 650 mm deep, including the lever and portafilter. The supplied design does not establish a complete working hydraulic or electrical system.</p>
    <button className="text-link" onClick={onClose}>Return to the experience <span>↗</span></button>
  </dialog>;
}
