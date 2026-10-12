export function LoadingScreen({ loaded, total, error, onRetry }: { loaded: number; total: number; error?: string; onRetry: () => void }) {
  const percent = total > 0 ? Math.round(loaded / total * 100) : null;
  return <div className="loading-screen" role={error ? "alert" : "status"}>
    <span className="micro">LA MARZOCCO / LINEA PB AV</span>
    <div className="loading-symbol" aria-hidden="true"><span /><span /><span /></div>
    <h2>{error ? "The model could not load." : "Preparing the anatomy."}</h2>
    {error ? <><p>{error}</p><button className="pill-button" onClick={onRetry}>Retry loading ↗</button></> : <><div className="loading-track"><span style={{ width: `${percent ?? 0}%` }} /></div><p className="micro">{percent === null ? "READING THE ASSET MANIFEST" : `${percent}% · ${Math.round(loaded / 1024).toLocaleString()} KB LOADED`}</p></>}
  </div>;
}
