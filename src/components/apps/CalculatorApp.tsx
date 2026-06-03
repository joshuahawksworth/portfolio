import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useCalculator } from './useCalculator';
import styles from './CalculatorApp.module.css';

const SCIENTIFIC_MIN_W = 360;
const SCIENTIFIC_MIN_H = 460;

type BtnProps = {
  className: string;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
};

function Btn({ className, onClick, children, small }: BtnProps) {
  return (
    <button
      type="button"
      className={`${className} ${small ? styles.small : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

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
    calc.opActive(op) ? styles.opActive : '';

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-scientific={showScientific ? 'true' : 'false'}
      data-mobile={isMobile ? 'true' : 'false'}
    >
      <div className={styles.display} aria-live="polite" aria-label={`Display: ${calc.display}`}>
        <span className={styles.displayValue}>{calc.display}</span>
        {showScientific && <span className={styles.modeBadge}>Scientific</span>}
      </div>

      {showScientific && (
        <div className={styles.scientificPad}>
          <Btn className={styles.sciFn} onClick={calc.trig.sin} small>
            sin
          </Btn>
          <Btn className={styles.sciFn} onClick={calc.trig.cos} small>
            cos
          </Btn>
          <Btn className={styles.sciFn} onClick={calc.trig.tan} small>
            tan
          </Btn>
          <Btn className={styles.sciFn} onClick={calc.advanced.ln} small>
            ln
          </Btn>

          <Btn className={styles.sciFn} onClick={calc.advanced.log} small>
            log
          </Btn>
          <Btn className={styles.sciFn} onClick={calc.advanced.sqrt} small>
            √
          </Btn>
          <Btn className={styles.sciFn} onClick={calc.advanced.square} small>
            x²
          </Btn>
          <Btn className={styles.sciFn} onClick={calc.advanced.pow} small>
            xʸ
          </Btn>

          <Btn className={styles.sciFn} onClick={calc.constants.pi} small>
            π
          </Btn>
          <Btn className={styles.sciFn} onClick={calc.constants.e} small>
            e
          </Btn>
          <Btn className={styles.sciFn} onClick={calc.backspace} small>
            ⌫
          </Btn>
          <Btn className={styles.sciFn} onClick={calc.clear} small>
            AC
          </Btn>
        </div>
      )}

      <div className={styles.pad}>
        {!showScientific && (
          <>
            <Btn className={styles.fn} onClick={calc.clear}>
              AC
            </Btn>
            <Btn className={styles.fn} onClick={calc.toggleSign}>
              ±
            </Btn>
            <Btn className={styles.fn} onClick={calc.percent}>
              %
            </Btn>
            <Btn className={`${styles.op} ${opCls('÷')}`} onClick={() => calc.setOp('÷')}>
              ÷
            </Btn>
          </>
        )}

        {showScientific && (
          <>
            <Btn className={styles.fn} onClick={calc.toggleSign}>
              ±
            </Btn>
            <Btn className={styles.fn} onClick={calc.percent}>
              %
            </Btn>
            <Btn className={`${styles.op} ${opCls('÷')}`} onClick={() => calc.setOp('÷')}>
              ÷
            </Btn>
            <Btn className={`${styles.op} ${opCls('×')}`} onClick={() => calc.setOp('×')}>
              ×
            </Btn>
          </>
        )}

        <Btn className={styles.digit} onClick={() => calc.inputDigit('7')}>
          7
        </Btn>
        <Btn className={styles.digit} onClick={() => calc.inputDigit('8')}>
          8
        </Btn>
        <Btn className={styles.digit} onClick={() => calc.inputDigit('9')}>
          9
        </Btn>
        {showScientific ? (
          <Btn
            className={styles.sciFn}
            onClick={() => calc.applyUnary((n) => (n === 0 ? NaN : 1 / n))}
            small
          >
            1/x
          </Btn>
        ) : (
          <Btn className={`${styles.op} ${opCls('×')}`} onClick={() => calc.setOp('×')}>
            ×
          </Btn>
        )}

        <Btn className={styles.digit} onClick={() => calc.inputDigit('4')}>
          4
        </Btn>
        <Btn className={styles.digit} onClick={() => calc.inputDigit('5')}>
          5
        </Btn>
        <Btn className={styles.digit} onClick={() => calc.inputDigit('6')}>
          6
        </Btn>
        <Btn className={`${styles.op} ${opCls('−')}`} onClick={() => calc.setOp('−')}>
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
        <Btn className={`${styles.op} ${opCls('+')}`} onClick={() => calc.setOp('+')}>
          +
        </Btn>

        <Btn className={`${styles.digit} ${styles.zero}`} onClick={() => calc.inputDigit('0')}>
          0
        </Btn>
        <Btn className={styles.digit} onClick={() => calc.inputDigit('.')}>
          .
        </Btn>
        <Btn className={styles.eq} onClick={calc.equals}>
          =
        </Btn>
      </div>
    </div>
  );
}
