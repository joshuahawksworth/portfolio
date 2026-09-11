/**
 * Word: a page you write Markdown on. The Home ribbon inserts formatting, the Markdown
 * view colours the syntax, and Print Layout renders it as a formatted document. Save
 * puts the .md into Documents.
 */
import { useMemo, useRef, useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import { ROOT_IDS } from '../../data/fileSystemSeed';
import { highlight } from './TextEditorApp';
import styles from './WordApp.module.css';

const STARTER = `# Joshua Hawksworth

**Senior Mobile Developer** · Manchester, UK

## Summary
Seven years building React and React Native apps, currently on the *Innovation team* at Arcus FM.

## Highlights
- Took a field engineer work-order app from prototype to production
- Embedded LLM features into day-to-day engineer workflows
- Coached the team on Claude via AWS Bedrock

> Tip: this page is Markdown. Switch to **Print Layout** on the View tab to see it formatted.

\`\`\`ts
const stack = ['React Native', 'TypeScript', 'Expo'];
\`\`\`
`;

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\((https?:[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
    );
}

/** A small Markdown renderer: headings, lists, quotes, code fences, paragraphs. */
export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  let code: string[] | null = null;
  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  for (const raw of lines) {
    if (code) {
      if (raw.startsWith('```')) {
        out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
        code = null;
      } else code.push(raw);
      continue;
    }
    if (raw.startsWith('```')) {
      closeList();
      code = [];
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(raw);
    if (h) {
      closeList();
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      continue;
    }
    const ul = /^\s*[-*+]\s+(.*)$/.exec(raw);
    const ol = /^\s*\d+\.\s+(.*)$/.exec(raw);
    if (ul || ol) {
      const kind = ul ? 'ul' : 'ol';
      if (list !== kind) {
        closeList();
        out.push(`<${kind}>`);
        list = kind;
      }
      out.push(`<li>${inline((ul ?? ol)![1])}</li>`);
      continue;
    }
    closeList();
    if (/^\s*>\s?/.test(raw)) {
      out.push(`<blockquote>${inline(raw.replace(/^\s*>\s?/, ''))}</blockquote>`);
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(raw)) {
      out.push('<hr />');
      continue;
    }
    if (raw.trim() === '') continue;
    out.push(`<p>${inline(raw)}</p>`);
  }
  closeList();
  if (code) out.push(`<pre><code>${esc((code as string[]).join('\n'))}</code></pre>`);
  return out.join('\n');
}

type Ribbon = 'home' | 'insert' | 'view';

export default function WordApp({ props }: { props?: Record<string, unknown> }) {
  const { fs, createFile, writeFile } = useDesktop();
  const [text, setText] = useState<string>(() =>
    typeof props?.content === 'string' ? props.content : STARTER
  );
  const [name, setName] = useState<string>(() =>
    typeof props?.filename === 'string' ? props.filename : 'Document1.md'
  );
  const [nodeId, setNodeId] = useState<string | null>(() =>
    typeof props?.fileId === 'string' && fs[props.fileId] ? props.fileId : null
  );
  const [ribbon, setRibbon] = useState<Ribbon>('home');
  const [view, setView] = useState<'markdown' | 'print'>('markdown');
  const [flash, setFlash] = useState<string | null>(null);
  const ta = useRef<HTMLTextAreaElement>(null);

  const rendered = useMemo(() => renderMarkdown(text), [text]);
  const coloured = useMemo(() => highlight(text, 'md'), [text]);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  function wrap(before: string, after = before, placeholder = 'text') {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = text.slice(s, e) || placeholder;
    const next = text.slice(0, s) + before + sel + after + text.slice(e);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = s + before.length;
      el.selectionEnd = s + before.length + sel.length;
    });
  }

  function linePrefix(prefix: string) {
    const el = ta.current;
    if (!el) return;
    const s = el.selectionStart;
    const lineStart = text.lastIndexOf('\n', s - 1) + 1;
    const next =
      text.slice(0, lineStart) +
      prefix +
      text.slice(lineStart).replace(/^(#{1,6}\s|[-*]\s|\d+\.\s|>\s)/, '');
    setText(next);
    requestAnimationFrame(() => el.focus());
  }

  function say(t: string) {
    setFlash(t);
    window.setTimeout(() => setFlash(null), 1800);
  }

  function save() {
    if (nodeId && fs[nodeId]) {
      writeFile(nodeId, text);
      say(`Saved ${name}`);
      return;
    }
    const id = createFile(ROOT_IDS.documents, name, text);
    const saved = fs[id]?.name ?? name;
    setNodeId(id);
    setName(saved);
    say(`Saved to Documents/${saved}`);
  }

  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        <span className={styles.wordMark}>W</span>
        <span className={styles.docName}>{name}</span>
        <span className={styles.autosave}>{nodeId ? 'Saved to Documents' : 'Not saved'}</span>
        <span className={styles.fill} />
        {flash && <span className={styles.flash}>{flash}</span>}
        <button type="button" className={styles.saveBtn} onClick={save}>
          Save
        </button>
      </div>
      <div className={styles.tabs}>
        {(['home', 'insert', 'view'] as Ribbon[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.tab} ${ribbon === t ? styles.tabActive : ''}`}
            onClick={() => setRibbon(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className={styles.ribbon}>
        {ribbon === 'home' && (
          <>
            <div className={styles.group}>
              <button type="button" className={styles.rb} onClick={() => wrap('**')} title="Bold">
                <b>B</b>
              </button>
              <button type="button" className={styles.rb} onClick={() => wrap('*')} title="Italic">
                <i>I</i>
              </button>
              <button type="button" className={styles.rb} onClick={() => wrap('`')} title="Code">
                {'<>'}
              </button>
              <span className={styles.groupLabel}>Font</span>
            </div>
            <div className={styles.group}>
              <button
                type="button"
                className={styles.rb}
                onClick={() => linePrefix('- ')}
                title="Bullets"
              >
                •≡
              </button>
              <button
                type="button"
                className={styles.rb}
                onClick={() => linePrefix('1. ')}
                title="Numbering"
              >
                1≡
              </button>
              <button
                type="button"
                className={styles.rb}
                onClick={() => linePrefix('> ')}
                title="Quote"
              >
                ❝
              </button>
              <span className={styles.groupLabel}>Paragraph</span>
            </div>
            <div className={styles.group}>
              {[
                ['Title', '# '],
                ['Heading 1', '## '],
                ['Heading 2', '### '],
                ['Normal', ''],
              ].map(([label, prefix]) => (
                <button
                  key={label}
                  type="button"
                  className={`${styles.rb} ${styles.styleBtn}`}
                  onClick={() => linePrefix(prefix)}
                >
                  {label}
                </button>
              ))}
              <span className={styles.groupLabel}>Styles</span>
            </div>
          </>
        )}
        {ribbon === 'insert' && (
          <div className={styles.group}>
            <button
              type="button"
              className={`${styles.rb} ${styles.styleBtn}`}
              onClick={() => wrap('[', '](https://)', 'link text')}
            >
              Link
            </button>
            <button
              type="button"
              className={`${styles.rb} ${styles.styleBtn}`}
              onClick={() => wrap('\n```ts\n', '\n```\n', 'code')}
            >
              Code block
            </button>
            <button
              type="button"
              className={`${styles.rb} ${styles.styleBtn}`}
              onClick={() => wrap('\n---\n', '', '')}
            >
              Rule
            </button>
            <span className={styles.groupLabel}>Insert</span>
          </div>
        )}
        {ribbon === 'view' && (
          <div className={styles.group}>
            <button
              type="button"
              className={`${styles.rb} ${styles.styleBtn} ${view === 'markdown' ? styles.rbOn : ''}`}
              onClick={() => setView('markdown')}
            >
              Markdown
            </button>
            <button
              type="button"
              className={`${styles.rb} ${styles.styleBtn} ${view === 'print' ? styles.rbOn : ''}`}
              onClick={() => setView('print')}
            >
              Print Layout
            </button>
            <span className={styles.groupLabel}>Views</span>
          </div>
        )}
      </div>

      <div className={styles.canvas}>
        <div className={styles.page}>
          {view === 'markdown' ? (
            <div className={styles.mdWrap}>
              <div
                className={styles.mdHighlight}
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: coloured + '\n' }}
              />
              <textarea
                ref={ta}
                className={styles.mdInput}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    save();
                  }
                }}
                spellCheck={false}
              />
            </div>
          ) : (
            <div className={styles.doc} dangerouslySetInnerHTML={{ __html: rendered }} />
          )}
        </div>
      </div>

      <div className={styles.statusBar}>
        <span>Page 1 of 1</span>
        <span>{words} words</span>
        <span>English (United Kingdom)</span>
        <span className={styles.fill} />
        <span>{view === 'markdown' ? 'Markdown' : 'Print Layout'}</span>
        <span>100%</span>
      </div>
    </div>
  );
}
