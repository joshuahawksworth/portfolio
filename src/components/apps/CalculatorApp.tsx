import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useCalculator } from './useCalculator';
import styles from './CalculatorApp.module.css';

const SCIENTIFIC_MIN_W = 520;
const SCIENTIFIC_MIN_H = 420;

type BtnProps = {
  className: string;
  onClick: () => void;
  children: React.ReactNode;
  label?: string;
};

function Btn({ className, onClick, children, label }: BtnProps) {
  return (
    <button type="button" className={className} onClick={onClick} aria-label={label}>
      {children}
    </button>
  );
}

/** Backspace glyph, drawn like the SF Symbol "delete.left". */
function BackspaceIcon() {
  return (
    <svg viewBox="0 0 28 20" width="30" height="22" fill="none" aria-hidden="true">
      <path
        d="M9.2 1.5H24.5Q27 1.5 27 4V16Q27 18.5 24.5 18.5H9.2Q8 18.5 7.2 17.6L1.6 11Q0.8 10 1.6 9L7.2 2.4Q8 1.5 9.2 1.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M13 6.5L20 13.5M20 6.5L13 13.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The ⁺/₋ key glyph: small plus, slash, small minus — like the SF Symbol. */
function PlusMinusIcon() {
  return (
    <svg viewBox="0 0 32 32" width="1.4em" height="1.4em" fill="none" aria-hidden="true">
      {/* small plus, top-left */}
      <path d="M8.5 6V14M4.5 10H12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* long thin slash */}
      <path d="M22.5 3L9.5 29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* small minus, bottom-right */}
      <path d="M19.5 22.5H27.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Apple Calculator: black canvas, thin white result, grey expression line above it,
 * dark-grey digit keys, light-grey function keys and orange operators. Round keys
 * on iPhone, rounded rectangles on the Mac, with the scientific pad when the window
 * is wide enough (like View › Scientific).
 */
export default function CalculatorApp() {
  const rootRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [scientific, setScientific] = useState(false);
  const calc = useCalculator();
  const showScientific = scientific && !isMobile;

  useEffect(() => {
    if (isMobile) {
      setScientific(false);
      return;
    }
    const el = rootRef.current;
    if (!el) return;

    const check = () => {
      const { width, height } = el.getBoundingClientRect();
      setScientific(width >= SCIENTIFIC_MIN_W && height >= SCIENTIFIC_MIN_H);
    };

    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        calc.inputDigit(key);
        return;
      }
      if (key === '.' || key === ',') {
        e.preventDefault();
        calc.inputDigit('.');
        return;
      }
      if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calc.equals();
        return;
      }
      if (key === 'Escape') {
        e.preventDefault();
        calc.clear();
        return;
      }
      if (key === 'Backspace') {
        e.preventDefault();
        calc.backspace();
        return;
      }
      if (key === '%') {
        e.preventDefault();
        calc.percent();
        return;
      }
      const opMap = {
        '+': '+',
        '-': '−',
        '*': '×',
        '/': '÷',
      } as const;
      if (key in opMap) {
        e.preventDefault();
        calc.setOp(opMap[key as keyof typeof opMap]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [calc]);

  const opCls = (op: Parameters<typeof calc.opActive>[0]) =>
    `${styles.op} ${calc.opActive(op) ? styles.opActive : ''}`;

  // Shrink the result as it gets long, like the real app does.
  const len = calc.display.length;
  const sizeCls =
    len > 12 ? styles.valueXS : len > 9 ? styles.valueS : len > 6 ? styles.valueM : '';

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-scientific={showScientific ? 'true' : 'false'}
      data-mobile={isMobile ? 'true' : 'false'}
    >
      <div className={styles.display} aria-live="polite" aria-label={`Display: ${calc.display}`}>
        <span className={styles.expression}>{calc.expression || ' '}</span>
        <span className={`${styles.displayValue} ${sizeCls}`}>{calc.display}</span>
      </div>

      <div className={styles.keys}>
        {showScientific && (
          <div className={styles.scientificPad}>
            <Btn className={styles.sci} onClick={() => calc.applyUnary((n) => n * n)}>
              x²
            </Btn>
            <Btn className={styles.sci} onClick={() => calc.applyUnary((n) => n * n * n)}>
              x³
            </Btn>
            <Btn className={styles.sci} onClick={calc.advanced.pow}>
              xʸ
            </Btn>
            <Btn className={styles.sci} onClick={() => calc.applyUnary((n) => Math.exp(n))}>
              eˣ
            </Btn>
            <Btn className={styles.sci} onClick={() => calc.applyUnary((n) => Math.pow(10, n))}>
              10ˣ
            </Btn>

            <Btn
              className={styles.sci}
              onClick={() => calc.applyUnary((n) => (n === 0 ? NaN : 1 / n))}
            >
              1/x
            </Btn>
            <Btn className={styles.sci} onClick={calc.advanced.sqrt}>
              √x
            </Btn>
            <Btn className={styles.sci} onClick={() => calc.applyUnary((n) => Math.cbrt(n))}>
              ∛x
            </Btn>
            <Btn className={styles.sci} onClick={calc.advanced.ln}>
              ln
            </Btn>
            <Btn className={styles.sci} onClick={calc.advanced.log}>
              log₁₀
            </Btn>

            <Btn className={styles.sci} onClick={calc.trig.sin}>
              sin
            </Btn>
            <Btn className={styles.sci} onClick={calc.trig.cos}>
              cos
            </Btn>
            <Btn className={styles.sci} onClick={calc.trig.tan}>
              tan
            </Btn>
            <Btn className={styles.sci} onClick={calc.constants.e}>
              e
            </Btn>
            <Btn className={styles.sci} onClick={calc.constants.pi}>
              π
            </Btn>

            <Btn
              className={styles.sci}
              onClick={() =>
                calc.applyUnary((n) => {
                  if (n < 0 || !Number.isInteger(n) || n > 170) return NaN;
                  let f = 1;
                  for (let i = 2; i <= n; i++) f *= i;
                  return f;
                })
              }
            >
              x!
            </Btn>
            <Btn className={styles.sci} onClick={() => calc.applyUnary((n) => Math.sinh(n))}>
              sinh
            </Btn>
            <Btn className={styles.sci} onClick={() => calc.applyUnary((n) => Math.cosh(n))}>
              cosh
            </Btn>
            <Btn className={styles.sci} onClick={() => calc.applyUnary((n) => Math.tanh(n))}>
              tanh
            </Btn>
            <Btn className={styles.sci} onClick={() => calc.applyUnary((n) => Math.random() * n)}>
              Rand
            </Btn>
          </div>
        )}

        <div className={styles.pad}>
          <Btn className={styles.fn} onClick={calc.backspace} label="Delete">
            <BackspaceIcon />
          </Btn>
          <Btn className={styles.fn} onClick={calc.clear} label="All clear">
            AC
          </Btn>
          <Btn className={styles.fn} onClick={calc.percent} label="Percent">
            %
          </Btn>
          <Btn className={opCls('÷')} onClick={() => calc.setOp('÷')} label="Divide">
            ÷
          </Btn>

          <Btn className={styles.digit} onClick={() => calc.inputDigit('7')}>
            7
          </Btn>
          <Btn className={styles.digit} onClick={() => calc.inputDigit('8')}>
            8
          </Btn>
          <Btn className={styles.digit} onClick={() => calc.inputDigit('9')}>
            9
          </Btn>
          <Btn className={opCls('×')} onClick={() => calc.setOp('×')} label="Multiply">
            ×
          </Btn>

          <Btn className={styles.digit} onClick={() => calc.inputDigit('4')}>
            4
          </Btn>
          <Btn className={styles.digit} onClick={() => calc.inputDigit('5')}>
            5
          </Btn>
          <Btn className={styles.digit} onClick={() => calc.inputDigit('6')}>
            6
          </Btn>
          <Btn className={opCls('−')} onClick={() => calc.setOp('−')} label="Subtract">
            −
          </Btn>

          <Btn className={styles.digit} onClick={() => calc.inputDigit('1')}>
            1
          </Btn>
          <Btn className={styles.digit} onClick={() => calc.inputDigit('2')}>
            2
          </Btn>
          <Btn className={styles.digit} onClick={() => calc.inputDigit('3')}>
            3
          </Btn>
          <Btn className={opCls('+')} onClick={() => calc.setOp('+')} label="Add">
            +
          </Btn>

          <Btn className={styles.digit} onClick={calc.toggleSign} label="Toggle sign">
            <PlusMinusIcon />
          </Btn>
          <Btn className={styles.digit} onClick={() => calc.inputDigit('0')}>
            0
          </Btn>
          <Btn className={styles.digit} onClick={() => calc.inputDigit('.')}>
            .
          </Btn>
          <Btn className={styles.op} onClick={calc.equals} label="Equals">
            =
          </Btn>
        </div>
      </div>
    </div>
  );
}
