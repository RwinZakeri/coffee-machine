import { useEffect, useRef } from "react";

const sources = [
  ["01", "Official product specifications", "Machine identity, dimensions and systems", "https://lamarzocco.com/uk/en/commercial-products/espresso-machines/linea-pb/"],
  ["02", "Linea PB — CAD archive", "Independent solids from the 2-group AV STEP assembly", "https://au.lamarzocco.com/wp-content/uploads/2023/09/linea_pb_2d_3d_CAD.zip"],
  ["03", "Parts catalog · V3.2", "Exploded assemblies and component references", "https://au.lamarzocco.com/wp-content/uploads/2023/09/LineaPB_Parts_Catalog_V3.2COLOR-2.pdf"],
  ["04", "Parts catalog · V3.8", "Cross-checking newer component documentation", "https://lamarzoccousa.com/wp-content/uploads/2025/11/LineaPB_Parts_Catalog_V3.8-min-1.pdf"],
];

export function SourcePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return <dialog className="source-dialog" ref={dialog} onCancel={onClose} onClick={(event) => { if (event.target === dialog.current) onClose(); }} aria-labelledby="source-title">
    <div className="dialog-header"><span className="micro">THE REFERENCE LIBRARY</span><button className="icon-button" onClick={onClose} aria-label="Close sources">×</button></div>
    <h2 id="source-title">Built on evidence.</h2>
    <p className="dialog-intro">An independent exploration of the Linea PB. Original geometry comes from La Marzocco’s published CAD. Catalog-supported reconstructions are identified separately.</p>
    <div className="source-list">{sources.map(([number, title, subtitle, url]) => <a key={number} href={url} target="_blank" rel="noreferrer"><span className="micro">{number}</span><span><strong>{title}</strong><small>{subtitle}</small></span><span aria-hidden="true">↗</span></a>)}</div>
    <p className="source-note">The design CAD does not contain a complete service assembly. Missing internal systems are disclosed in each chapter and in ASSET_GAPS.md. OEM geometry is supplied for this local study; the manufacturer’s drawings require written permission for redistribution.</p>
    <button className="text-link" onClick={onClose}>Return to the experience <span>↗</span></button>
  </dialog>;
}
