import { useEffect, useMemo, useRef, useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { useSystemUI } from '../../context/SystemUIContext';
import { launchSystemApp, searchSystemApps, useSystemApps } from './systemApps';
import styles from './SystemUI.module.css';

const EMPTY_LIMIT = 8;

/** Safe arithmetic evaluator (digits, + - * / ( ) .) — no eval. */
function evaluateArithmetic(expr: string): number | null {
  const src = expr.replace(/\s+/g, '');
  if (!/^[\d+\-*/().]+$/.test(src) || !/\d/.test(src) || !/[+\-*/()]/.test(src)) return null;

  let pos = 0;
  const peek = () => src[pos];
  const parseNumber = (): number => {
    const start = pos;
    while (pos < src.length && /[\d.]/.test(src[pos])) pos += 1;
    const n = Number(src.slice(start, pos));
    if (start === pos || Number.isNaN(n)) throw new Error('bad number');
    return n;
  };
  const parseFactor = (): number => {
    if (peek() === '-') {
      pos += 1;
      return -parseFactor();
    }
    if (peek() === '+') {
      pos += 1;
      return parseFactor();
    }
    if (peek() === '(') {
      pos += 1;
      const v = parseExpr();
      if (peek() !== ')') throw new Error('unbalanced');
      pos += 1;
      return v;
    }
    return parseNumber();
  };
  const parseTerm = (): number => {
    let v = parseFactor();
    while (peek() === '*' || peek() === '/') {
      const op = src[pos];
      pos += 1;
      const rhs = parseFactor();
      v = op === '*' ? v * rhs : v / rhs;
    }
    return v;
  };
  const parseExpr = (): number => {
    let v = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = src[pos];
      pos += 1;
      const rhs = parseTerm();
      v = op === '+' ? v + rhs : v - rhs;
    }
    return v;
  };

  try {
    const value = parseExpr();
    if (pos !== src.length || !Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toPrecision(12)));
}

export default function Spotlight() {
  const { openApp } = useDesktop();
  const { close } = useSystemUI();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const calc = useMemo(() => evaluateArithmetic(query), [query]);
  const catalogue = useSystemApps();
  const apps = useMemo(() => {
    const q = query.trim();
    return q ? searchSystemApps(q, catalogue) : catalogue.slice(0, EMPTY_LIMIT);
  }, [query, catalogue]);

  // Row 0 is the calculator line when present; apps follow.
  const rowCount = apps.length + (calc !== null ? 1 : 0);
  const clampedSelected = Math.min(selected, Math.max(0, rowCount - 1));

  function activate(index: number) {
    const appIndex = calc !== null ? index - 1 : index;
    if (calc !== null && index === 0) {
      openApp('calculator');
      close();
      return;
    }
    const app = apps[appIndex];
    if (!app) return;
    launchSystemApp(app, openApp);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, rowCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate(clampedSelected);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }

  return (
    <div className={styles.spotlightLayer}>
      <div className={styles.backdrop} onMouseDown={close} aria-hidden="true" />
      <div
        className={`${styles.glass} ${styles.spotlight}`}
        role="dialog"
        aria-label="Spotlight Search"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.spotlightInputRow}>
          <svg
            className={styles.spotlightGlyph}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="6.8" cy="6.8" r="4.6" />
            <path d="M10.4 10.4L14 14" />
          </svg>
          <input
            ref={inputRef}
            className={styles.spotlightInput}
            type="text"
            placeholder="Spotlight Search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Spotlight Search"
            aria-activedescendant={rowCount ? `spotlight-row-${clampedSelected}` : undefined}
          />
        </div>

        <div className={styles.spotlightBody}>
          {calc !== null && (
            <>
              <div className={styles.sectionLabel}>Calculator</div>
              <ul className={styles.resultList} role="listbox" aria-label="Calculator">
                <li>
                  <button
                    type="button"
                    id="spotlight-row-0"
                    role="option"
                    aria-selected={clampedSelected === 0}
                    className={`${styles.resultRow} ${clampedSelected === 0 ? styles.resultRowSelected : ''}`}
                    onMouseEnter={() => setSelected(0)}
                    onClick={() => activate(0)}
                  >
                    <span className={styles.calcIcon} aria-hidden="true">
                      =
                    </span>
                    <span className={`${styles.resultTitle} ${styles.calcResult}`}>
                      {query.trim()} = {formatNumber(calc)}
                    </span>
                    <span className={styles.resultHint}>Calculator</span>
                  </button>
                </li>
              </ul>
            </>
          )}

          <div className={styles.sectionLabel}>Applications</div>
          {apps.length === 0 ? (
            <div className={styles.empty}>No results for “{query.trim()}”</div>
          ) : (
            <ul className={styles.resultList} role="listbox" aria-label="Applications">
              {apps.map((app, i) => {
                const rowIndex = calc !== null ? i + 1 : i;
                const isSelected = rowIndex === clampedSelected;
                return (
                  <li key={app.id}>
                    <button
                      type="button"
                      id={`spotlight-row-${rowIndex}`}
                      role="option"
                      aria-selected={isSelected}
                      className={`${styles.resultRow} ${isSelected ? styles.resultRowSelected : ''}`}
                      onMouseEnter={() => setSelected(rowIndex)}
                      onClick={() => activate(rowIndex)}
                    >
                      <span className={styles.resultIcon} aria-hidden="true">
                        {app.icon}
                      </span>
                      <span className={styles.resultTitle}>{app.title}</span>
                      <span className={styles.resultHint}>Application</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={styles.spotlightFooter}>
          <span>Open ⏎</span>
          <span>·</span>
          <span>Close esc</span>
        </div>
      </div>
    </div>
  );
}
