/**
 * Shared body for the Xcode and Android Studio replicas: a toolbar with Run / Stop and
 * the scheme, a project navigator, a code editor, a console and the phone simulator.
 * Building is theatre (a progress bar, then the phone boots); the point is the phone.
 */
import { useEffect, useMemo, useState } from 'react';
import { highlight } from './TextEditorApp';
import PhoneSimulator, { type SimPlatform } from './PhoneSimulator';
import styles from './IdeApp.module.css';

export interface IdeFile {
  name: string;
  code: string;
  /** Extension used for syntax colouring. */
  ext: string;
}

export interface IdeShellProps {
  flavour: 'xcode' | 'studio';
  platform: SimPlatform;
  scheme: string;
  device: string;
  files: IdeFile[];
  buildLog: string[];
  statusLeft: string;
  navigatorTitle: string;
  simulatorTitle: string;
}

export default function IdeShell({
  flavour,
  platform,
  scheme,
  device,
  files,
  buildLog,
  statusLeft,
  navigatorTitle,
  simulatorTitle,
}: IdeShellProps) {
  const [active, setActive] = useState(files[0]);
  const [phase, setPhase] = useState<'idle' | 'building' | 'running'>('idle');
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (phase !== 'building') return;
    setProgress(0);
    setLog([]);
    let step = 0;
    const t = window.setInterval(() => {
      step += 1;
      setProgress(Math.min(100, step * (100 / buildLog.length)));
      setLog((prev) => [...prev, buildLog[step - 1]].filter(Boolean));
      if (step >= buildLog.length) {
        window.clearInterval(t);
        window.setTimeout(() => setPhase('running'), 350);
      }
    }, 380);
    return () => window.clearInterval(t);
  }, [phase, buildLog]);

  const lines = useMemo(() => highlight(active.code, active.ext).split('\n'), [active]);
  const isXcode = flavour === 'xcode';

  return (
    <div className={`${styles.root} ${isXcode ? styles.xcode : styles.studio}`}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.runBtn}
          onClick={() => setPhase('building')}
          disabled={phase === 'building'}
          aria-label="Run"
          title={isXcode ? 'Run (⌘R)' : 'Run app (^R)'}
        >
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M4 2.5v11l9-5.5z" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.stopBtn}
          onClick={() => setPhase('idle')}
          disabled={phase === 'idle'}
          aria-label="Stop"
        >
          <svg viewBox="0 0 16 16" width="12" height="12">
            <rect x="3" y="3" width="10" height="10" rx="1.5" />
          </svg>
        </button>
        <span className={styles.scheme}>
          {scheme} <span className={styles.schemeSep}>›</span> {device}
        </span>
        <span className={styles.activity}>
          {phase === 'building' ? (
            <>
              <span>Building {scheme}…</span>
              <span className={styles.activityBar}>
                <span className={styles.activityFill} style={{ width: `${progress}%` }} />
              </span>
            </>
          ) : phase === 'running' ? (
            <span>
              Running {scheme} on {device}
            </span>
          ) : (
            <span>
              {isXcode ? 'Ready' : 'Gradle sync finished'} · press Run to launch the app on the{' '}
              {isXcode ? 'Simulator' : 'Emulator'}
            </span>
          )}
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.navigator}>
          <div className={styles.navHead}>{navigatorTitle}</div>
          <div className={styles.tree}>
            {files.map((f, i) => (
              <button
                key={f.name}
                type="button"
                className={`${styles.treeRow} ${f.name === active.name ? styles.treeActive : ''}`}
                style={{ paddingLeft: 10 + (i === 0 ? 0 : 14) }}
                onClick={() => setActive(f)}
              >
                <span className={styles.treeGlyph}>{i === 0 ? '▣' : '▤'}</span>
                {f.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.editor}>
          <div className={styles.editorTabs}>
            <span className={styles.editorTab}>{active.name}</span>
          </div>
          <div className={styles.jumpBar}>
            {scheme} › {active.name}
          </div>
          <pre className={styles.code}>
            {lines.map((l, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: l || ' ' }} />
            ))}
          </pre>
          <div className={styles.console}>
            {log.length === 0 ? (
              <span>{isXcode ? 'Console' : 'Run'} — build output appears here.</span>
            ) : (
              log.map((l, i) => (
                <div key={i}>
                  {i === log.length - 1 && phase === 'running' ? <strong>{l}</strong> : l}
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.simPane}>
          <div className={styles.simHead}>
            <span>{simulatorTitle}</span>
            <span>{device}</span>
          </div>
          <div className={styles.simHint}>
            {phase === 'running'
              ? 'Tap Arcus Engineer. The other apps are props — install the real IDE for those.'
              : 'Browser mock of the simulator. Press Run to boot it.'}
          </div>
          <div className={styles.simStage}>
            <PhoneSimulator platform={platform} running={phase === 'running'} scale={0.78} />
          </div>
        </div>
      </div>

      <div className={styles.statusBar}>
        <span>{statusLeft}</span>
        <span className={styles.statusFill} />
        <span>{phase === 'running' ? 'Running' : phase === 'building' ? 'Building' : 'Idle'}</span>
      </div>
    </div>
  );
}
