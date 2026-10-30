import { useMemo, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { jobsContent } from '../../data/experienceContent';
import styles from './CalendarApp.module.css';

type View = 'day' | 'week' | 'month' | 'year';
const VIEWS: Array<{ id: View; label: string }> = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];
const DAY_HEADS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PALETTE = ['#1a73e8', '#34a853', '#ff9500', '#af52de', '#ff2d55', '#5ac8fa', '#8e8e93'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

interface CalEvent {
  date: Date;
  title: string;
  color: string;
}

/** "November 2025" or "Feb 2023" → the first of that month; "Present" → null. */
function parseMonth(s: string): Date | null {
  const m = /^([A-Za-z]+)\s+(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const idx = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
  return idx < 0 ? null : new Date(Number(m[2]), idx, 1);
}

/** The roles as all-day events: the month each one started and ended. */
const EVENTS: CalEvent[] = jobsContent.flatMap((job, i) => {
  const [from, to] = job.period.split(' - ');
  const color = PALETTE[i % PALETTE.length];
  const out: CalEvent[] = [];
  const start = parseMonth(from);
  const end = parseMonth(to ?? '');
  if (start) out.push({ date: start, title: `Started at ${job.company}`, color });
  if (end) out.push({ date: end, title: `Left ${job.company}`, color });
  return out;
});

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
/** Monday of the week holding `d`. */
const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
/** Six Monday-first weeks covering the month, as the Calendar grid shows them. */
function monthGrid(year: number, month: number): Date[] {
  const first = startOfWeek(new Date(year, month, 1));
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}
const eventsOn = (d: Date) => EVENTS.filter((e) => sameDay(e.date, d));
const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-GB', opts);

export default function CalendarApp() {
  const { os } = useSettings();
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(today);
  const [selected, setSelected] = useState(today);

  function step(n: number) {
    setCursor((c) =>
      view === 'day'
        ? addDays(c, n)
        : view === 'week'
          ? addDays(c, 7 * n)
          : view === 'month'
            ? addMonths(c, n)
            : new Date(c.getFullYear() + n, c.getMonth(), 1)
    );
  }
  function goToday() {
    setCursor(today);
    setSelected(today);
  }
  function pick(d: Date) {
    setSelected(d);
    setCursor(d);
  }

  const title =
    view === 'year'
      ? String(cursor.getFullYear())
      : view === 'day'
        ? fmt(cursor, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : view === 'week'
          ? weekTitle(cursor)
          : fmt(cursor, { month: 'long', year: 'numeric' });

  return (
    <div className={styles.root} data-os={os}>
      <div className={styles.toolbar}>
        <div className={styles.segmented} role="tablist" aria-label="View">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              className={`${styles.segment} ${view === v.id ? styles.segmentOn : ''}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <MiniMonth cursor={cursor} selected={selected} today={today} onPick={pick} />
          <div className={styles.legend}>
            <span className={styles.legendTitle}>Calendars</span>
            <label className={styles.legendRow}>
              <span className={styles.legendDot} style={{ background: PALETTE[0] }} />
              Work
            </label>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.head}>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.nav}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => step(-1)}
                aria-label="Previous"
              >
                <Chevron dir="left" />
              </button>
              <button type="button" className={styles.todayBtn} onClick={goToday}>
                Today
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => step(1)}
                aria-label="Next"
              >
                <Chevron dir="right" />
              </button>
            </div>
          </header>

          {view === 'month' && (
            <MonthView cursor={cursor} selected={selected} today={today} onPick={pick} />
          )}
          {view === 'year' && (
            <YearView
              year={cursor.getFullYear()}
              today={today}
              onPick={(d) => {
                pick(d);
                setView('month');
              }}
            />
          )}
          {(view === 'week' || view === 'day') && (
            <TimeGrid
              days={
                view === 'week'
                  ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i))
                  : [cursor]
              }
              today={today}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function weekTitle(d: Date): string {
  const a = startOfWeek(d);
  const b = addDays(a, 6);
  const sameMonth = a.getMonth() === b.getMonth();
  return sameMonth
    ? `${fmt(a, { day: 'numeric' })} – ${fmt(b, { day: 'numeric', month: 'long', year: 'numeric' })}`
    : `${fmt(a, { day: 'numeric', month: 'short' })} – ${fmt(b, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 12 20"
      width="7"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dir === 'left' ? <path d="M10 2L2 10l8 8" /> : <path d="M2 2l8 8-8 8" />}
    </svg>
  );
}

function MiniMonth({
  cursor,
  selected,
  today,
  onPick,
}: {
  cursor: Date;
  selected: Date;
  today: Date;
  onPick: (d: Date) => void;
}) {
  const [shown, setShown] = useState(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  const month = shown.getMonth();
  return (
    <div className={styles.mini}>
      <div className={styles.miniHead}>
        <button
          type="button"
          className={styles.miniNav}
          onClick={() => setShown(addMonths(shown, -1))}
          aria-label="Previous month"
        >
          <Chevron dir="left" />
        </button>
        <span className={styles.miniTitle}>{fmt(shown, { month: 'long', year: 'numeric' })}</span>
        <button
          type="button"
          className={styles.miniNav}
          onClick={() => setShown(addMonths(shown, 1))}
          aria-label="Next month"
        >
          <Chevron dir="right" />
        </button>
      </div>
      <div className={styles.miniGrid}>
        {DAY_HEADS.map((h, i) => (
          <span key={i} className={styles.miniDow}>
            {h}
          </span>
        ))}
        {monthGrid(shown.getFullYear(), month).map((d) => (
          <button
            key={d.toISOString()}
            type="button"
            className={[
              styles.miniDay,
              d.getMonth() !== month ? styles.miniDayOut : '',
              sameDay(d, today) ? styles.miniToday : '',
              sameDay(d, selected) && !sameDay(d, today) ? styles.miniSelected : '',
            ].join(' ')}
            onClick={() => onPick(d)}
            aria-label={fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          >
            {d.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

function MonthView({
  cursor,
  selected,
  today,
  onPick,
}: {
  cursor: Date;
  selected: Date;
  today: Date;
  onPick: (d: Date) => void;
}) {
  const month = cursor.getMonth();
  return (
    <div className={styles.month}>
      <div className={styles.monthHead}>
        {DAY_NAMES.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
      <div className={styles.monthGrid}>
        {monthGrid(cursor.getFullYear(), month).map((d) => {
          const out = d.getMonth() !== month;
          const events = eventsOn(d);
          return (
            <button
              key={d.toISOString()}
              type="button"
              className={`${styles.cell} ${out ? styles.cellOut : ''} ${sameDay(d, selected) ? styles.cellSelected : ''}`}
              onClick={() => onPick(d)}
              aria-label={fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })}
            >
              <span className={`${styles.cellDate} ${sameDay(d, today) ? styles.cellToday : ''}`}>
                {d.getDate() === 1 && !sameDay(d, today)
                  ? fmt(d, { day: 'numeric', month: 'short' })
                  : d.getDate()}
              </span>
              {events.map((e) => (
                <span key={e.title} className={styles.chip} style={{ background: e.color }}>
                  {e.title}
                </span>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YearView({
  year,
  today,
  onPick,
}: {
  year: number;
  today: Date;
  onPick: (d: Date) => void;
}) {
  return (
    <div className={styles.year}>
      {Array.from({ length: 12 }, (_, m) => (
        <div key={m} className={styles.yearMonth}>
          <button
            type="button"
            className={styles.yearMonthName}
            onClick={() => onPick(new Date(year, m, 1))}
          >
            {fmt(new Date(year, m, 1), { month: 'long' })}
          </button>
          <div className={styles.yearGrid}>
            {DAY_HEADS.map((h, i) => (
              <span key={i} className={styles.yearDow}>
                {h}
              </span>
            ))}
            {monthGrid(year, m).map((d) => (
              <button
                key={d.toISOString()}
                type="button"
                className={`${styles.yearDay} ${d.getMonth() !== m ? styles.yearDayOut : ''} ${sameDay(d, today) ? styles.yearToday : ''} ${eventsOn(d).length ? styles.yearDayEvent : ''}`}
                onClick={() => onPick(d)}
                aria-label={fmt(d, { day: 'numeric', month: 'long', year: 'numeric' })}
              >
                {d.getDate()}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimeGrid({ days, today }: { days: Date[]; today: Date }) {
  const now = new Date();
  const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;
  return (
    <div className={styles.timeGrid} style={{ '--days': days.length } as React.CSSProperties}>
      <div className={styles.timeHead}>
        <span className={styles.timeGutter} />
        {days.map((d) => (
          <div key={d.toISOString()} className={styles.timeDayHead}>
            <span className={styles.timeDow}>{fmt(d, { weekday: 'short' })}</span>
            <span className={`${styles.timeDate} ${sameDay(d, today) ? styles.cellToday : ''}`}>
              {d.getDate()}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.allDay}>
        <span className={styles.timeGutter}>all-day</span>
        {days.map((d) => (
          <div key={d.toISOString()} className={styles.allDayCell}>
            {eventsOn(d).map((e) => (
              <span key={e.title} className={styles.chip} style={{ background: e.color }}>
                {e.title}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className={styles.hours}>
        <div className={styles.hourLabels}>
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className={styles.hourLabel}>
              {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
            </span>
          ))}
        </div>
        {days.map((d) => (
          <div key={d.toISOString()} className={styles.hourCol}>
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className={styles.hourLine} />
            ))}
            {sameDay(d, today) && <span className={styles.nowLine} style={{ top: `${nowTop}%` }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
