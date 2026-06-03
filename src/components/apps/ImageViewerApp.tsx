import { useState } from 'react';
import styles from './ImageViewerApp.module.css';

export default function ImageViewerApp({ props }: { props?: Record<string, unknown> }) {
  const filename = (props?.filename as string) ?? 'image';
  const dataUrl  = (props?.dataUrl  as string) ?? '';
  const [zoom, setZoom] = useState(1);
  const [fit,  setFit]  = useState(true);

  function zoomIn()  { setFit(false); setZoom(z => Math.min(z * 1.25, 8)); }
  function zoomOut() { setFit(false); setZoom(z => Math.max(z / 1.25, 0.1)); }
  function resetZoom() { setFit(true); setZoom(1); }

  if (!dataUrl) {
    return (
      <div className={styles.root}>
        <div className={styles.empty}>No image data</div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <span className={styles.filename}>{filename}</span>
        <div className={styles.controls}>
          <button className={styles.toolBtn} onClick={zoomOut} title="Zoom out">−</button>
          <button className={styles.toolBtn} onClick={resetZoom} title="Fit to window">
            {fit ? '⊡' : `${Math.round(zoom * 100)}%`}
          </button>
          <button className={styles.toolBtn} onClick={zoomIn} title="Zoom in">+</button>
          <a
            href={dataUrl}
            download={filename}
            className={styles.downloadBtn}
            title="Download"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 2v8M4 7l3 3 3-3"/><path d="M2 12h10"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Image canvas */}
      <div
        className={styles.viewport}
        onWheel={(e) => {
          e.preventDefault();
          setFit(false);
          setZoom(z => Math.min(Math.max(z * (e.deltaY < 0 ? 1.1 : 0.9), 0.1), 8));
        }}
      >
        <img
          src={dataUrl}
          alt={filename}
          className={styles.img}
          style={fit
            ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
            : { transform: `scale(${zoom})`, transformOrigin: 'center center' }
          }
          draggable={false}
        />
      </div>

      {/* Status */}
      <div className={styles.statusBar}>
        <span>{fit ? 'Fit' : `${Math.round(zoom * 100)}%`}</span>
        <span className={styles.sep} />
        <span>{filename}</span>
        <span className={styles.hint}>Scroll to zoom</span>
      </div>
    </div>
  );
}
