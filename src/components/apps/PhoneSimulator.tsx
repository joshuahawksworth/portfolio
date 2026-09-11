/**
 * The phone inside Xcode's Simulator and Android Studio's Emulator. It boots, shows a
 * home screen with a handful of stock apps (which explain that they're props) and one
 * working app: Arcus Engineer, a light mock of the work-order app Josh built at Arcus FM.
 */
import { useEffect, useState } from 'react';
import arcusLogo from '../../assets/company-logos/arcusfm.png';
import styles from './PhoneSimulator.module.css';

export type SimPlatform = 'ios' | 'android';

interface WorkOrder {
  id: string;
  site: string;
  address: string;
  asset: string;
  task: string;
  priority: 'P1' | 'P2' | 'P3';
  due: string;
  status: 'scheduled' | 'in-progress' | 'complete';
  steps: string[];
}

const WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-48213',
    site: 'Sainsbury’s Fallowfield',
    address: 'Wilmslow Rd, Manchester',
    asset: 'Chiller CH-04 (dairy aisle)',
    task: 'Reactive — temperature alarm, +9 °C',
    priority: 'P1',
    due: '11:00',
    status: 'scheduled',
    steps: [
      'Isolate and check compressor',
      'Inspect condenser coil and fans',
      'Log temperatures at 15 min intervals',
      'Photograph rectification',
    ],
  },
  {
    id: 'WO-48190',
    site: 'Sainsbury’s Salford',
    address: 'Regent Rd, Salford',
    asset: 'AHU-2 roof plant',
    task: 'PPM — quarterly filter change',
    priority: 'P3',
    due: '14:30',
    status: 'scheduled',
    steps: [
      'Replace panel filters (x6)',
      'Check belt tension',
      'Clean drain tray',
      'Record readings',
    ],
  },
  {
    id: 'WO-48155',
    site: 'Argos Trafford',
    address: 'Trafford Centre',
    asset: 'Roller shutter, goods-in',
    task: 'Reactive — shutter stuck half open',
    priority: 'P2',
    due: '16:00',
    status: 'scheduled',
    steps: ['Check limit switches', 'Inspect drive chain', 'Test safety edge', 'Customer sign-off'],
  },
];

const STOCK_APPS: Record<SimPlatform, { id: string; label: string; bg: string; glyph: string }[]> =
  {
    ios: [
      { id: 'messages', label: 'Messages', bg: '#34c759', glyph: '💬' },
      { id: 'safari', label: 'Safari', bg: '#1b8cff', glyph: '🧭' },
      { id: 'photos', label: 'Photos', bg: '#ffffff', glyph: '🌸' },
      { id: 'maps', label: 'Maps', bg: '#4cd964', glyph: '🗺️' },
      { id: 'camera', label: 'Camera', bg: '#8e8e93', glyph: '📷' },
      { id: 'settings', label: 'Settings', bg: '#8e8e93', glyph: '⚙️' },
      { id: 'testflight', label: 'TestFlight', bg: '#1b8cff', glyph: '✈️' },
    ],
    android: [
      { id: 'messages', label: 'Messages', bg: '#1a73e8', glyph: '💬' },
      { id: 'chrome', label: 'Chrome', bg: '#ffffff', glyph: '🌐' },
      { id: 'photos', label: 'Photos', bg: '#ffffff', glyph: '🌸' },
      { id: 'maps', label: 'Maps', bg: '#ffffff', glyph: '🗺️' },
      { id: 'camera', label: 'Camera', bg: '#ffffff', glyph: '📷' },
      { id: 'settings', label: 'Settings', bg: '#e8eaed', glyph: '⚙️' },
      { id: 'play', label: 'Play Store', bg: '#ffffff', glyph: '▶️' },
    ],
  };

type Screen = { kind: 'home' } | { kind: 'stock'; id: string } | { kind: 'arcus' };

export default function PhoneSimulator({
  platform,
  running,
  scale = 1,
}: {
  platform: SimPlatform;
  /** False shows the powered-off glass; true boots the phone. */
  running: boolean;
  scale?: number;
}) {
  const [booted, setBooted] = useState(false);
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    if (!running) {
      setBooted(false);
      setScreen({ kind: 'home' });
      return;
    }
    const t = window.setTimeout(() => setBooted(true), 1400);
    return () => window.clearTimeout(t);
  }, [running]);

  useEffect(() => {
    const t = window.setInterval(() => setTime(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const ios = platform === 'ios';
  const clock = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`${styles.device} ${ios ? styles.iphone : styles.pixel}`}
      style={{ transform: `scale(${scale})` }}
      aria-label={ios ? 'iPhone 17 Pro simulator' : 'Pixel 10 Pro emulator'}
    >
      <div className={styles.screen}>
        {!running ? (
          <div className={styles.off} />
        ) : !booted ? (
          <div className={styles.boot}>
            {ios ? (
              <span className={styles.apple} aria-hidden="true" />
            ) : (
              <span className={styles.droidBoot}>android</span>
            )}
          </div>
        ) : (
          <>
            <div className={styles.statusBar}>
              <span>{clock}</span>
              <span className={styles.statusRight}>{ios ? '●●●● ᯤ ▮' : 'ᯤ ▲ ▮ 100%'}</span>
            </div>
            {ios && <div className={styles.island} aria-hidden="true" />}
            {!ios && <div className={styles.punch} aria-hidden="true" />}

            {screen.kind === 'home' && (
              <div className={styles.home}>
                <div className={styles.grid}>
                  <button
                    type="button"
                    className={styles.app}
                    onClick={() => setScreen({ kind: 'arcus' })}
                  >
                    <span className={`${styles.appIcon} ${styles.arcusIcon}`}>
                      <img src={arcusLogo} alt="" />
                    </span>
                    <span className={styles.appLabel}>Arcus Engineer</span>
                  </button>
                  {STOCK_APPS[platform].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className={styles.app}
                      onClick={() => setScreen({ kind: 'stock', id: a.id })}
                    >
                      <span className={styles.appIcon} style={{ background: a.bg }}>
                        <span aria-hidden="true">{a.glyph}</span>
                      </span>
                      <span className={styles.appLabel}>{a.label}</span>
                    </button>
                  ))}
                </div>
                <div className={styles.dock}>
                  {STOCK_APPS[platform].slice(0, 4).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className={styles.dockApp}
                      onClick={() => setScreen({ kind: 'stock', id: a.id })}
                      aria-label={a.label}
                    >
                      <span className={styles.appIcon} style={{ background: a.bg }}>
                        <span aria-hidden="true">{a.glyph}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {screen.kind === 'stock' && (
              <div className={styles.stock}>
                <div className={styles.stockGlyph} aria-hidden="true">
                  {STOCK_APPS[platform].find((a) => a.id === screen.id)?.glyph}
                </div>
                <h4>{STOCK_APPS[platform].find((a) => a.id === screen.id)?.label}</h4>
                <p>
                  This is a browser mock of the {ios ? 'iOS Simulator' : 'Android Emulator'}: the
                  stock apps are props. Only Arcus Engineer runs. For the real thing, install{' '}
                  {ios ? 'Xcode' : 'Android Studio'}.
                </p>
                <button
                  type="button"
                  className={styles.stockBack}
                  onClick={() => setScreen({ kind: 'home' })}
                >
                  Back to Home
                </button>
              </div>
            )}

            {screen.kind === 'arcus' && (
              <ArcusEngineer platform={platform} onHome={() => setScreen({ kind: 'home' })} />
            )}

            <button
              type="button"
              className={styles.homeBar}
              onClick={() => setScreen({ kind: 'home' })}
              aria-label="Home"
            />
          </>
        )}
      </div>
    </div>
  );
}

/** Arcus Engineer: today's work orders, a job sheet, and closing a job out. */
function ArcusEngineer({ platform, onHome }: { platform: SimPlatform; onHome: () => void }) {
  const [orders, setOrders] = useState<WorkOrder[]>(WORK_ORDERS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, Set<number>>>({});
  const ios = platform === 'ios';
  const order = orders.find((o) => o.id === openId) ?? null;

  function setStatus(id: string, status: WorkOrder['status']) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  function toggleStep(id: string, i: number) {
    setDone((prev) => {
      const next = new Set(prev[id] ?? []);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return { ...prev, [id]: next };
    });
  }

  const remaining = orders.filter((o) => o.status !== 'complete').length;

  if (order) {
    const steps = done[order.id] ?? new Set<number>();
    const allDone = steps.size === order.steps.length;
    return (
      <div className={`${styles.arcus} ${ios ? styles.arcusIos : styles.arcusDroid}`}>
        <div className={styles.arcusBar}>
          <button type="button" className={styles.arcusBack} onClick={() => setOpenId(null)}>
            {ios ? '‹ Today' : '←'}
          </button>
          <span className={styles.arcusTitle}>{order.id}</span>
          <span className={`${styles.prio} ${styles[`prio_${order.priority}`]}`}>
            {order.priority}
          </span>
        </div>
        <div className={styles.arcusBody}>
          <div className={styles.woHead}>
            <div className={styles.woSite}>{order.site}</div>
            <div className={styles.woSub}>{order.address}</div>
            <div className={styles.woSub}>{order.asset}</div>
            <div className={styles.woTask}>{order.task}</div>
          </div>
          <div className={styles.woSection}>Job sheet</div>
          {order.steps.map((s, i) => (
            <label key={i} className={styles.step}>
              <input
                type="checkbox"
                checked={steps.has(i)}
                onChange={() => toggleStep(order.id, i)}
                disabled={order.status === 'complete'}
              />
              <span>{s}</span>
            </label>
          ))}
          {order.status === 'scheduled' && (
            <button
              type="button"
              className={styles.cta}
              onClick={() => setStatus(order.id, 'in-progress')}
            >
              Start job
            </button>
          )}
          {order.status === 'in-progress' && (
            <button
              type="button"
              className={styles.cta}
              disabled={!allDone}
              onClick={() => setStatus(order.id, 'complete')}
            >
              {allDone ? 'Complete job' : `${steps.size}/${order.steps.length} steps done`}
            </button>
          )}
          {order.status === 'complete' && (
            <div className={styles.doneNote}>Closed out · synced to the work order service</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.arcus} ${ios ? styles.arcusIos : styles.arcusDroid}`}>
      <div className={styles.arcusBar}>
        <button type="button" className={styles.arcusBack} onClick={onHome} aria-label="Home">
          {ios ? '‹' : '☰'}
        </button>
        <span className={styles.arcusTitle}>Today</span>
        <span className={styles.arcusAvatar}>JH</span>
      </div>
      <div className={styles.arcusBody}>
        <div className={styles.summary}>
          <strong>{remaining}</strong> open · {orders.length - remaining} complete
        </div>
        {orders.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`${styles.wo} ${o.status === 'complete' ? styles.woDone : ''}`}
            onClick={() => setOpenId(o.id)}
          >
            <span className={styles.woRow}>
              <span className={`${styles.prio} ${styles[`prio_${o.priority}`]}`}>{o.priority}</span>
              <span className={styles.woId}>{o.id}</span>
              <span className={styles.woDue}>{o.due}</span>
            </span>
            <span className={styles.woSite}>{o.site}</span>
            <span className={styles.woSub}>{o.task}</span>
            <span className={`${styles.status} ${styles[`status_${o.status}`]}`}>
              {o.status === 'in-progress'
                ? 'In progress'
                : o.status === 'complete'
                  ? 'Complete'
                  : 'Scheduled'}
            </span>
          </button>
        ))}
        <div className={styles.arcusFoot}>
          Mock of the field engineer app Josh built at Arcus FM. Data is made up.
        </div>
      </div>
    </div>
  );
}
