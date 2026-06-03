import { useCallback, useState } from 'react';

export type Op = '+' | '−' | '×' | '÷' | '^' | null;

export function formatDisplay(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  const str = String(value);
  if (str.length <= 14) return str;
  return value.toPrecision(10).replace(/\.?0+$/, '');
}

export function parseDisplay(display: string): number {
  const n = parseFloat(display);
  return Number.isFinite(n) ? n : 0;
}

const DEG = Math.PI / 180;

export function useCalculator() {
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<Op>(null);
  const [fresh, setFresh] = useState(true);

  const apply = useCallback((a: number, b: number, op: Op): number => {
    switch (op) {
      case '+':
        return a + b;
      case '−':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b === 0 ? NaN : a / b;
      case '^':
        return Math.pow(a, b);
      default:
        return b;
    }
  }, []);

  const inputDigit = useCallback(
    (digit: string) => {
      setDisplay((prev) => {
        if (fresh || prev === 'Error') {
          setFresh(false);
          return digit === '.' ? '0.' : digit;
        }
        if (digit === '.' && prev.includes('.')) return prev;
        if (prev === '0' && digit !== '.') return digit;
        if (prev.replace(/[.-]/g, '').length >= 14) return prev;
        return prev + digit;
      });
    },
    [fresh]
  );

  const clear = useCallback(() => {
    setDisplay('0');
    setStored(null);
    setOperator(null);
    setFresh(true);
  }, []);

  const toggleSign = useCallback(() => {
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error') return prev;
      return prev.startsWith('-') ? prev.slice(1) : `-${prev}`;
    });
    setFresh(false);
  }, []);

  const percent = useCallback(() => {
    setDisplay((prev) => formatDisplay(parseDisplay(prev) / 100));
    setFresh(false);
  }, []);

  const setOp = useCallback(
    (op: Op) => {
      const current = parseDisplay(display);
      if (stored !== null && operator && !fresh) {
        const result = apply(stored, current, operator);
        setDisplay(formatDisplay(result));
        setStored(result);
      } else {
        setStored(current);
      }
      setOperator(op);
      setFresh(true);
    },
    [display, stored, operator, fresh, apply]
  );

  const equals = useCallback(() => {
    if (operator === null || stored === null) return;
    const current = parseDisplay(display);
    const result = apply(stored, current, operator);
    setDisplay(formatDisplay(result));
    setStored(null);
    setOperator(null);
    setFresh(true);
  }, [display, stored, operator, apply]);

  const applyUnary = useCallback((fn: (n: number) => number) => {
    setDisplay((prev) => formatDisplay(fn(parseDisplay(prev))));
    setFresh(true);
  }, []);

  const insertConstant = useCallback((value: number) => {
    setDisplay(formatDisplay(value));
    setFresh(true);
  }, []);

  const backspace = useCallback(() => {
    setDisplay((prev) => {
      if (fresh || prev === 'Error' || prev.length <= 1) return '0';
      const next = prev.slice(0, -1);
      return next === '-' ? '0' : next;
    });
    setFresh(false);
  }, []);

  const opActive = (op: Op) => operator === op && !fresh;

  return {
    display,
    operator,
    inputDigit,
    clear,
    toggleSign,
    percent,
    setOp,
    equals,
    applyUnary,
    insertConstant,
    backspace,
    opActive,
    trig: {
      sin: () => applyUnary((n) => Math.sin(n * DEG)),
      cos: () => applyUnary((n) => Math.cos(n * DEG)),
      tan: () => applyUnary((n) => Math.tan(n * DEG)),
    },
    advanced: {
      ln: () => applyUnary((n) => (n > 0 ? Math.log(n) : NaN)),
      log: () => applyUnary((n) => (n > 0 ? Math.log10(n) : NaN)),
      sqrt: () => applyUnary((n) => (n >= 0 ? Math.sqrt(n) : NaN)),
      square: () => applyUnary((n) => n * n),
      pow: () => setOp('^'),
    },
    constants: {
      pi: () => insertConstant(Math.PI),
      e: () => insertConstant(Math.E),
    },
  };
}
