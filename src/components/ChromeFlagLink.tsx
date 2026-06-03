import styles from './ChromeFlagLink.module.css';

export const CHROME_CANVAS_DRAW_ELEMENT_FLAG = 'chrome://flags/#canvas-draw-element';

interface Props {
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function ChromeFlagLink({ className, onClick }: Props) {
  return (
    <a
      href={CHROME_CANVAS_DRAW_ELEMENT_FLAG}
      className={[styles.link, className].filter(Boolean).join(' ')}
      onClick={e => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      {CHROME_CANVAS_DRAW_ELEMENT_FLAG}
    </a>
  );
}
