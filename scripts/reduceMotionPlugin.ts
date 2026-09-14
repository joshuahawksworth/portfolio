import type { AtRule, Declaration, Plugin, Rule } from 'postcss';

/**
 * PostCSS plugin behind the Reduce Motion mode. For every rule that declares a transition or
 * a one-shot animation it emits two variants, one under `@media (prefers-reduced-motion:
 * reduce)` and one under `html[data-reduce-motion='on']`, that cut the duration to a fraction
 * of its length. Only declared motion is touched: an element with no transition of its own
 * (a window being dragged, a slider thumb) stays instant, because giving everything a
 * duration would make every JavaScript-driven position ease after the pointer. Looping
 * animations (spinners, progress bars, a blinking cursor) are left alone: their motion is
 * the information. Anything inside a [data-essential-motion] subtree keeps its own timing too.
 */
export interface ReduceMotionOptions {
  /** Duration every declared transition is cut to. */
  transition?: string;
  /** Duration every declared one-shot animation is cut to. */
  animation?: string;
}

const GUARD = ':where(:not([data-essential-motion], [data-essential-motion] *))';
const SETTING = "html[data-reduce-motion='on']";
const MEDIA = '(prefers-reduced-motion: reduce)';

const TIME = /(-?\d*\.?\d+)(ms|s)\b/g;

/** Total positive time (in ms) mentioned in a value, or 0 when it names none. */
function longestTime(value: string): number {
  let max = 0;
  for (const m of value.matchAll(TIME)) {
    const n = parseFloat(m[1]) * (m[2] === 's' ? 1000 : 1);
    if (n > max) max = n;
  }
  return max;
}

interface Motion {
  transition?: 'shorten' | 'zero';
  animation?: 'shorten';
  important: boolean;
}

/** What a rule declares about motion, or null when it declares none. */
function motionOf(rule: Rule): Motion | null {
  const out: Motion = { important: false };
  let loops = false;
  rule.each((node) => {
    if (node.type !== 'decl') return;
    const decl = node as Declaration;
    const prop = decl.prop.toLowerCase();
    const value = decl.value.toLowerCase();
    if (prop === 'transition' || prop === 'transition-duration') {
      if (prop === 'transition' && /^\s*none\s*$/.test(value)) return;
      // A transition explicitly switched off (0s) stays off: a duration must not revive it.
      out.transition = longestTime(value) > 0 ? 'shorten' : 'zero';
      out.important ||= decl.important === true;
    } else if (prop === 'animation' || prop === 'animation-duration') {
      if (prop === 'animation' && /^\s*none\s*$/.test(value)) return;
      if (/\binfinite\b/.test(value)) loops = true;
      if (longestTime(value) > 0) {
        out.animation = 'shorten';
        out.important ||= decl.important === true;
      }
    } else if (prop === 'animation-iteration-count' && /\binfinite\b/.test(value)) {
      loops = true;
    }
  });
  if (loops) delete out.animation;
  return out.transition || out.animation ? out : null;
}

function insideKeyframes(rule: Rule): boolean {
  let parent = rule.parent;
  while (parent && parent.type !== 'root') {
    if (parent.type === 'atrule' && /keyframes$/i.test((parent as AtRule).name)) return true;
    parent = parent.parent;
  }
  return false;
}

const PSEUDO_ELEMENT = /::|:(before|after|first-line|first-letter|placeholder|selection|marker)\b/;

/** The selector with the essential-motion guard on its last compound, ahead of any pseudo-element. */
export function guardSelector(selector: string): string {
  const s = selector.trim();
  const at = s.search(PSEUDO_ELEMENT);
  return at === -1 ? s + GUARD : s.slice(0, at) + GUARD + s.slice(at);
}

/** The guarded selector scoped to the Reduce Motion setting on <html>. */
export function settingSelector(selector: string): string {
  const s = guardSelector(selector);
  if (/^html\b/.test(s)) return s.replace(/^html/, SETTING);
  if (/^:root\b/.test(s)) return s.replace(/^:root/, `:root[data-reduce-motion='on']`);
  return `${SETTING} ${s}`;
}

export function reduceMotionVariants(options: ReduceMotionOptions = {}): Plugin {
  const transition = options.transition ?? '0.12s';
  const animation = options.animation ?? '0.16s';
  return {
    postcssPlugin: 'reduce-motion-variants',
    Once(root, { AtRule, Rule, Declaration }) {
      // Collect first: inserting while walking would visit the generated rules too.
      const targets: { rule: Rule; motion: Motion }[] = [];
      root.walkRules((rule) => {
        if (insideKeyframes(rule)) return;
        const motion = motionOf(rule);
        if (motion) targets.push({ rule, motion });
      });
      for (const { rule, motion } of targets) {
        const decls = (): Declaration[] => {
          const out: Declaration[] = [];
          const add = (prop: string, value: string) =>
            out.push(new Declaration({ prop, value, important: motion.important }));
          if (motion.transition === 'shorten') add('transition-duration', transition);
          if (motion.transition === 'zero') add('transition-duration', '0s');
          if (motion.animation) {
            add('animation-duration', animation);
            add('animation-iteration-count', '1');
          }
          return out;
        };
        const setting = new Rule({ selector: rule.selectors.map(settingSelector).join(',\n') });
        setting.append(...decls());
        const media = new AtRule({ name: 'media', params: MEDIA });
        const mediaRule = new Rule({ selector: rule.selectors.map(guardSelector).join(',\n') });
        mediaRule.append(...decls());
        media.append(mediaRule);
        // `after` inserts directly behind the rule, so add in reverse to keep media first.
        rule.after(setting);
        rule.after(media);
      }
    },
  };
}

reduceMotionVariants.postcss = true;
