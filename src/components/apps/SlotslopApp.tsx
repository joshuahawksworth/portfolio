import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { classifySlot, HARNESSES, Outcome, positiveMod } from './slotslopData';
import styles from './SlotslopApp.module.css';

type SlotPhase = 'spinning' | 'result' | 'running';
type SlotState = {
  task: string;
  idx: [number, number, number];
  stopping: [boolean, boolean, boolean];
  stopped: [boolean, boolean, boolean];
  wait: [number, number, number];
  delay: [number, number, number];
  phase: SlotPhase;
  runStep: number;
  shock: number;
};

const FRAME_MS = 70;
const STOP_AT = 7;
const RUN_STEPS = [
  'resolved harness adapter',
  'hydrated model config',
  'attached workspace context',
  'streaming agent run',
  'run complete',
];
const REEL_ROWS = [-2, -1, 0, 1, 2];
const DEFAULT_PROMPT = 'I want to release slotslop';
const CONFETTI_THEMES = {
  party: {
    glyphs: ['★', '✦', '✧', '●', '◆', '▲', '▼', '✺', '❉', '♦', '♥', '•', '*'],
    colors: [
      '#ff2d95',
      '#00e5ff',
      '#ffe600',
      '#7cff00',
      '#ff7a00',
      '#b026ff',
      '#ff0040',
      '#19ffd0',
      '#ffffff',
    ],
  },
  bust: {
    glyphs: ['✗', '✘', '×', '▼', '☓', '■', '↓'],
    colors: ['#e74c3c', '#c0392b', '#7f1d1d', '#922b21', '#555555', '#ff3b3b'],
  },
  amber: {
    glyphs: ['✦', '★', '✧', '·', '•'],
    colors: ['#f39c12', '#e67e22', '#d35400', '#f1c40f', '#888888'],
  },
  gloom: {
    glyphs: ['·', '˙', ':', '.', '‚', '⋅'],
    colors: ['#6272a4', '#46506b', '#5b6b8c', '#444455', '#384057'],
  },
};

type ConfettiTheme = keyof typeof CONFETTI_THEMES;
type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  color: string;
  life: number;
  spin: number;
};

const ALL_MODELS = HARNESSES.flatMap((harness) => harness.models).filter(
  (model, index, all) => all.findIndex((item) => item.id === model.id) === index
);
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]!;

function getHarness(state: SlotState) {
  return HARNESSES[positiveMod(state.idx[0], HARNESSES.length)];
}

function getModel(state: SlotState) {
  const harness = getHarness(state);
  return harness.models[positiveMod(state.idx[1], harness.models.length)];
}

function getEffort(state: SlotState) {
  const model = getModel(state);
  return model.efforts[positiveMod(state.idx[2], model.efforts.length)];
}

function getCommand(state: SlotState) {
  const harness = getHarness(state);
  const model = getModel(state);
  return harness.buildCommand(model, getEffort(state), state.task);
}

function getOutcomeTheme(outcome: Outcome): ConfettiTheme {
  if (outcome.vibe === 'win') return 'party';
  if (outcome.vibe === 'soclose') return 'amber';
  if (outcome.kind === 'gemini') return 'gloom';
  return 'bust';
}

function Reel({
  title,
  items,
  index,
  active,
  stopped,
  stopping,
  done,
}: {
  title: string;
  items: string[];
  index: number;
  active: boolean;
  stopped: boolean;
  stopping: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`${styles.reel} ${active && !done ? styles.reelActive : ''} ${stopped ? styles.reelStopped : ''} ${stopping ? styles.reelStopping : ''}`}
    >
      <div className={styles.reelTitle}>
        {stopped ? `✓ ${title}` : active && !done ? `▸ ${title} ◂` : title}
      </div>
      <div className={styles.reelBox}>
        {REEL_ROWS.map((offset) => {
          const item = items[positiveMod(index + offset, items.length)];
          const selected = offset === 0;
          return (
            <div
              key={`${item}-${offset}`}
              className={`${styles.reelRow} ${selected ? styles.payline : ''} ${selected && stopping ? styles.paylineStopping : ''}`}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarqueeBar({ outcome, offset = 0 }: { outcome?: Outcome; offset?: number }) {
  const bars = Array.from({ length: 84 }, (_, index) => index);
  const hue = outcome?.hue;
  return (
    <div className={styles.marquee} aria-hidden="true">
      {bars.map((index) => (
        <span
          key={index}
          style={
            {
              '--i': index + offset,
              '--hue': hue ?? 0,
            } as React.CSSProperties
          }
          className={hue == null ? styles.marqueeRainbow : styles.marqueeMood}
        />
      ))}
    </div>
  );
}

function ConfettiLayer({ particles }: { particles: Particle[] }) {
  if (particles.length === 0) return null;
  return (
    <div className={styles.confettiLayer} aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={styles.confetti}
          style={{
            left: particle.x,
            top: particle.y,
            color: particle.color,
            transform: `rotate(${particle.spin * 32}deg)`,
            opacity: Math.max(0, Math.min(1, particle.life / 1.2)),
          }}
        >
          {particle.char}
        </span>
      ))}
    </div>
  );
}

function Shockwave({ pulse }: { pulse: number }) {
  if (pulse === 0) return null;
  return <div key={pulse} className={styles.shockwave} aria-hidden="true" />;
}

function makeInitialState(task = DEFAULT_PROMPT): SlotState {
  return {
    task,
    idx: [0, 0, 0],
    stopping: [false, false, false],
    stopped: [false, false, false],
    wait: [0, 0, 0],
    delay: [0, 0, 0],
    phase: 'spinning',
    runStep: 0,
    shock: 0,
  };
}

export default function SlotslopApp({ props }: { props?: Record<string, unknown> }) {
  const task = typeof props?.task === 'string' ? props.task : DEFAULT_PROMPT;
  const [state, setState] = useState(() => makeInitialState(task));
  const [particles, setParticles] = useState<Particle[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const particlesRef = useRef<Particle[]>([]);
  const nextParticleIdRef = useRef(1);
  const intervalRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const runTimerRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const selected = useMemo(() => {
    const harness = getHarness(state);
    const model = getModel(state);
    const effort = getEffort(state);
    const outcome = classifySlot(harness, model, effort);
    return { harness, model, effort, outcome, command: getCommand(state) };
  }, [state]);

  const activeCol = state.stopped[0] ? (state.stopped[1] ? (state.stopped[2] ? -1 : 2) : 1) : 0;
  const done = state.phase !== 'spinning';
  const reelItems = [
    HARNESSES.map((harness) => harness.label),
    state.stopped[0]
      ? selected.harness.models.map((model) => model.label)
      : ALL_MODELS.map((model) => model.label),
    state.stopped[1] ? selected.model.efforts : ['no-reasoning', 'low', 'medium', 'high'],
  ] as const;

  const addParticle = useCallback((particle: Omit<Particle, 'id'>) => {
    particlesRef.current = [
      ...particlesRef.current.slice(-219),
      { ...particle, id: nextParticleIdRef.current++ },
    ];
  }, []);

  const burst = useCallback(
    (x: number, y: number, count: number, theme: ConfettiTheme = 'party') => {
      const source = CONFETTI_THEMES[theme];
      for (let index = 0; index < count; index += 1) {
        const angle = rand(-Math.PI * 0.92, -Math.PI * 0.08);
        const speed = rand(12, 30) * 9;
        addParticle({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          char: pick(source.glyphs),
          color: pick(source.colors),
          life: rand(1.1, 2),
          spin: rand(0, 10),
        });
      }
    },
    [addParticle]
  );

  const rain = useCallback(
    (count: number, theme: ConfettiTheme = 'party') => {
      const width = rootRef.current?.clientWidth ?? 900;
      const source = CONFETTI_THEMES[theme];
      for (let index = 0; index < count; index += 1) {
        addParticle({
          x: rand(0, width),
          y: rand(-50, 0),
          vx: rand(-45, 45),
          vy: rand(95, 180),
          char: pick(source.glyphs),
          color: pick(source.colors),
          life: rand(2.5, 4),
          spin: rand(0, 10),
        });
      }
    },
    [addParticle]
  );

  const reelCenter = useCallback((index: number) => {
    const rect = rootRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 900;
    const height = rect?.height ?? 560;
    return {
      x: width * (0.22 + index * 0.28),
      y: height * 0.42,
    };
  }, []);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setState((prev) => {
        if (prev.phase !== 'spinning') return prev;

        const idx = [...prev.idx] as [number, number, number];
        const stopping = [...prev.stopping] as [boolean, boolean, boolean];
        const stopped = [...prev.stopped] as [boolean, boolean, boolean];
        const wait = [...prev.wait] as [number, number, number];
        const delay = [...prev.delay] as [number, number, number];
        let phase: SlotPhase = prev.phase;

        const pools = [
          HARNESSES,
          stopped[0] ? HARNESSES[positiveMod(idx[0], HARNESSES.length)].models : ALL_MODELS,
          stopped[1]
            ? getModel(prev).efforts
            : (['no-reasoning', 'low', 'medium', 'high'] as const),
        ];

        for (let col = 0; col < 3; col += 1) {
          if (stopped[col]) continue;
          if (!stopping[col]) {
            idx[col] = (idx[col] + 1) % pools[col].length;
            continue;
          }

          wait[col] -= 1;
          if (wait[col] > 0) continue;
          idx[col] = (idx[col] + 1) % pools[col].length;
          delay[col] += 1;
          wait[col] = delay[col];

          if (delay[col] > STOP_AT) {
            stopping[col] = false;
            stopped[col] = true;
            const center = reelCenter(col);
            burst(center.x, center.y - 18, col === 2 ? 70 : 42, 'party');

            if (col === 0) {
              const harness = HARNESSES[positiveMod(idx[0], HARNESSES.length)];
              idx[1] = Math.floor(Math.random() * harness.models.length);
            } else if (col === 1) {
              const model = getModel({ ...prev, idx, stopped });
              idx[2] = Math.floor(Math.random() * model.efforts.length);
            } else {
              phase = 'result';
              const finalState = { ...prev, idx, stopped, phase } as SlotState;
              const outcome = classifySlot(
                getHarness(finalState),
                getModel(finalState),
                getEffort(finalState)
              );
              const theme = getOutcomeTheme(outcome);
              if (outcome.vibe === 'win') rain(90, theme);
              else if (outcome.vibe === 'soclose') burst(center.x, center.y - 18, 55, theme);
              else if (outcome.kind === 'gemini') rain(40, theme);
              else {
                rain(120, theme);
                burst(center.x, center.y, 40, theme);
              }
            }
          }
        }

        return { ...prev, idx, stopping, stopped, wait, delay, phase };
      });
    }, FRAME_MS);

    let last = performance.now();
    const animate = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const current = stateRef.current;
      if (current.phase !== 'spinning') {
        const outcome = classifySlot(getHarness(current), getModel(current), getEffort(current));
        const theme = getOutcomeTheme(outcome);
        if (outcome.vibe === 'win' && Math.random() < 0.28) rain(2, theme);
        else if (outcome.kind === 'gemini' && Math.random() < 0.14) rain(1, theme);
        else if (outcome.vibe === 'lose' && Math.random() < 0.28) rain(3, theme);
      }

      particlesRef.current = particlesRef.current
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx * dt,
          y: particle.y + particle.vy * dt,
          vy: particle.vy + 420 * dt,
          life: particle.life - dt,
          spin: particle.spin + dt * 8,
        }))
        .filter(
          (particle) =>
            particle.life > 0 && particle.y < (rootRef.current?.clientHeight ?? 600) + 24
        );
      setParticles(particlesRef.current);
      rafRef.current = window.requestAnimationFrame(animate);
    };
    rafRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (runTimerRef.current) window.clearTimeout(runTimerRef.current);
    };
  }, [burst, rain, reelCenter]);

  function startRun() {
    if (runTimerRef.current) window.clearTimeout(runTimerRef.current);
    setState((prev) => ({ ...prev, phase: 'running', runStep: 0 }));

    let step = 0;
    const advance = () => {
      step += 1;
      setState((prev) => ({ ...prev, runStep: step }));
      if (step < RUN_STEPS.length) {
        runTimerRef.current = window.setTimeout(advance, 520);
      }
    };
    runTimerRef.current = window.setTimeout(advance, 420);
  }

  function stopNextReel() {
    setState((prev) => {
      if (prev.phase !== 'spinning') return prev;
      const stopping = [...prev.stopping] as [boolean, boolean, boolean];
      const wait = [...prev.wait] as [number, number, number];
      const delay = [...prev.delay] as [number, number, number];
      const nextCol = prev.stopped.findIndex((value) => !value);
      if (nextCol === -1) return prev;
      if (stopping[nextCol]) return prev;
      stopping[nextCol] = true;
      delay[nextCol] = 1;
      wait[nextCol] = 1;
      return {
        ...prev,
        stopping,
        wait,
        delay,
        shock: prev.shock + 1,
      };
    });
  }

  function reset() {
    if (runTimerRef.current) window.clearTimeout(runTimerRef.current);
    setState(makeInitialState(task));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (stateRef.current.phase === 'result') startRun();
      else if (stateRef.current.phase === 'spinning') stopNextReel();
      return;
    }
    if (event.key === 'Escape' || event.key === 'q' || event.key === 'Q') {
      event.preventDefault();
      reset();
    }
  }

  return (
    <div
      ref={rootRef}
      className={styles.root}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseDown={(event) => event.currentTarget.focus()}
    >
      <ConfettiLayer particles={particles} />
      <Shockwave pulse={state.shock} />

      <div className={styles.machine}>
        <div className={styles.title}>
          <span className={styles.titleIcon}>🎰</span>
          <span className={styles.titleText}>S L O T - S L O P</span>
          <span className={styles.titleIcon}>🎰</span>
        </div>
        <div className={styles.task}>task: {state.task}</div>
        <MarqueeBar outcome={done ? selected.outcome : undefined} />

        <div className={styles.reels}>
          {reelItems.map((items, index) => (
            <Reel
              key={index}
              title={['HARNESS', 'MODEL', 'EFFORT'][index]}
              items={[...items]}
              index={state.idx[index]}
              active={activeCol === index}
              stopped={state.stopped[index]}
              stopping={state.stopping[index]}
              done={done}
            />
          ))}
        </div>

        <MarqueeBar outcome={done ? selected.outcome : undefined} offset={42} />

        {done ? (
          <div className={styles.result}>
            <div
              className={
                selected.outcome.vibe === 'win' ? styles.resultTitleWin : styles.resultTitleMood
              }
            >
              {selected.outcome.title}
            </div>
            <div className={styles.resultSubtitle}>{selected.outcome.subtitle}</div>
            <div className={styles.commandBox}>{selected.command}</div>
            <div className={styles.controls}>
              <span>↵ run it now</span>
              <span>esc to leave</span>
            </div>

            {state.phase === 'running' && (
              <div className={styles.runPanel}>
                <div className={styles.runPrompt}>$ {selected.command}</div>
                {RUN_STEPS.map((step, index) => {
                  const complete = state.runStep > index;
                  const active = state.runStep === index;
                  return (
                    <div
                      key={step}
                      className={`${styles.runStep} ${complete ? styles.runComplete : ''} ${active ? styles.runActive : ''}`}
                    >
                      <span>{complete ? '✓' : active ? '…' : '·'}</span>
                      {step}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.instructions}>
            press <strong>↵ / space</strong> to stop the{' '}
            <strong>{['harness', 'model', 'effort'][activeCol]}</strong> reel
            <span>(q to quit)</span>
          </div>
        )}
      </div>
    </div>
  );
}
