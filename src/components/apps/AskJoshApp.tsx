import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { answerLocally, streamLocally } from '../../lib/localAnswers';
import styles from './AskJoshApp.module.css';

type Role = 'user' | 'assistant';
type ErrorKind = 'unconfigured' | 'rate_limited' | 'generic';

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  error?: ErrorKind;
}

interface Chat {
  id: string;
  messages: ChatMessage[];
}

const SUGGESTIONS = [
  'What has Josh built with React Native?',
  "Summarise Josh's experience",
  'Which industries has Josh worked in?',
  'How do I contact Josh?',
];

const ERROR_TEXT: Record<ErrorKind, string> = {
  unconfigured:
    "The assistant isn't configured on this deployment yet (missing ANTHROPIC_API_KEY).",
  rate_limited:
    "You've sent quite a few messages in a short time — give it a few minutes and try again.",
  generic: 'Something went wrong reaching the assistant. Please try again in a moment.',
};

const SIGN_IN_KEY = 'portfolio.askclaude.account';

type Provider = 'key' | 'guest';

interface Account {
  name: string;
  provider: Provider;
  /** The visitor's own Anthropic API key. Kept in this browser only. */
  apiKey?: string;
}

const KEY_PATTERN = /^sk-ant-[A-Za-z0-9_-]{20,}$/;

function loadAccount(): Account | null {
  try {
    const raw = localStorage.getItem(SIGN_IN_KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

function saveAccount(account: Account | null) {
  try {
    if (account) localStorage.setItem(SIGN_IN_KEY, JSON.stringify(account));
    else localStorage.removeItem(SIGN_IN_KEY);
  } catch {
    /* private mode */
  }
}

let idCounter = 0;
const nextId = () => `${Date.now().toString(36)}-${(idCounter += 1)}`;
const newChat = (): Chat => ({ id: nextId(), messages: [] });

function chatTitle(chat: Chat): string {
  const first = chat.messages.find((m) => m.role === 'user')?.content.trim();
  if (!first) return 'New chat';
  return first.length > 42 ? `${first.slice(0, 41)}…` : first;
}

// ── Tiny safe markdown renderer (bold, inline code, links, bullets, line breaks) ──
const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE_RE)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    if (token.startsWith('**')) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      nodes.push(<code key={key++}>{token.slice(1, -1)}</code>);
    } else {
      const close = token.indexOf('](');
      const label = token.slice(1, close);
      const href = token.slice(close + 2, -1);
      nodes.push(
        <a key={key++} href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
    last = start + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderMarkdown(text: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(
      <p key={blocks.length}>
        {paragraph.map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {renderInline(line)}
          </span>
        ))}
      </p>
    );
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((item, i) => <li key={i}>{renderInline(item)}</li>);
    blocks.push(
      list.ordered ? <ol key={blocks.length}>{items}</ol> : <ul key={blocks.length}>{items}</ul>
    );
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/^#{1,4}\s+(.*)$/, '**$1**');
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)![1]);
    } else if (line.trim() === '') {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function PencilIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.3 2.3a1.6 1.6 0 0 1 2.3 2.3L5.2 13 2 14l1-3.2z" />
      <path d="M10 3.6l2.4 2.4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="13"
      height="13"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <path d="M2.5 3.5h11v7h-6L4.5 13v-2.5h-2z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" />
    </svg>
  );
}

/**
 * The sign-in sheet shown over the app. There is no public "Sign in with Claude" for
 * third-party sites, so visitors who want real answers use their own Anthropic API key;
 * everyone else continues as a guest and gets answers built from the portfolio data.
 */
function SignInGate({
  onSignIn,
  error,
}: {
  onSignIn: (account: Account) => void;
  error?: string | null;
}) {
  const [mode, setMode] = useState<'choose' | 'key'>('choose');
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const valid = KEY_PATTERN.test(key.trim());

  function submitKey() {
    if (!valid || busy) return;
    setBusy(true);
    window.setTimeout(
      () => onSignIn({ name: 'Your Claude API key', provider: 'key', apiKey: key.trim() }),
      300
    );
  }

  return (
    <div className={styles.gate} role="dialog" aria-modal="true" aria-labelledby="askclaude-signin">
      <div className={styles.gateCard}>
        <img className={styles.gateIcon} src="/icons/claude.png" alt="" draggable={false} />
        <h2 id="askclaude-signin" className={styles.gateTitle}>
          {mode === 'key' ? 'Use your Claude API key' : 'Chat with Claude'}
        </h2>
        {mode === 'choose' ? (
          <>
            <p className={styles.gateText}>
              Ask about Josh's work, experience and projects. Bring your own Anthropic API key to
              talk to Claude itself, or continue as a guest for answers built from the portfolio.
            </p>
            {error && <p className={styles.gateError}>{error}</p>}
            <button
              type="button"
              className={`${styles.gateBtn} ${styles.gateBtnPrimary}`}
              onClick={() => setMode('key')}
            >
              <img src="/icons/claude-symbol.png" alt="" width={16} height={16} draggable={false} />
              Use my Claude API key
            </button>
            <button
              type="button"
              className={styles.gateBtn}
              onClick={() => onSignIn({ name: 'Guest', provider: 'guest' })}
            >
              Continue as guest
            </button>
            <p className={styles.gateFoot}>
              Guests never send anything to a model. Keys are stored only in this browser.
            </p>
          </>
        ) : (
          <>
            <p className={styles.gateText}>
              Paste a key from{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                console.anthropic.com
              </a>
              . It stays in this browser and is only forwarded to this site's Claude route for your
              own messages; it is never stored on the server.
            </p>
            <input
              className={styles.gateInput}
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitKey()}
              placeholder="sk-ant-…"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              aria-label="Anthropic API key"
            />
            {key && !valid && (
              <p className={styles.gateError}>
                That doesn't look like an Anthropic key (they start with sk-ant-).
              </p>
            )}
            <button
              type="button"
              className={`${styles.gateBtn} ${styles.gateBtnPrimary}`}
              onClick={submitKey}
              disabled={!valid || busy}
            >
              {busy ? <span className={styles.gateBusy} /> : null}
              Start chatting
            </button>
            <button type="button" className={styles.gateBtn} onClick={() => setMode('choose')}>
              Back
            </button>
            <p className={styles.gateFoot}>Usage is billed to your own Anthropic account.</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function AskJoshApp() {
  const [account, setAccount] = useState<Account | null>(loadAccount);
  const [gateError, setGateError] = useState<string | null>(null);
  // Once /api/ask reports it has no key, stay offline for the session instead of retrying.
  const offlineRef = useRef(false);
  function signIn(next: Account) {
    saveAccount(next);
    setAccount(next);
    setGateError(null);
  }
  function signOut() {
    saveAccount(null);
    setAccount(null);
  }
  const [chats, setChats] = useState<Chat[]>(() => [newChat()]);
  const [activeId, setActiveId] = useState(() => chats[0].id);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find((c) => c.id === activeId) ?? chats[0];
  const isEmpty = activeChat.messages.length === 0;

  const visibleChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chats.filter(
      (c) => c.messages.length > 0 && (q === '' || chatTitle(c).toLowerCase().includes(q))
    );
  }, [chats, search]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeChat.messages]);

  useEffect(() => {
    if (!streaming) textareaRef.current?.focus();
  }, [streaming, activeId]);

  const updateMessage = useCallback(
    (
      chatId: string,
      messageId: string,
      patch: Partial<ChatMessage> | ((m: ChatMessage) => Partial<ChatMessage>)
    ) => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id !== chatId
            ? chat
            : {
                ...chat,
                messages: chat.messages.map((m) =>
                  m.id !== messageId
                    ? m
                    : { ...m, ...(typeof patch === 'function' ? patch(m) : patch) }
                ),
              }
        )
      );
    },
    []
  );

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || streaming) return;

      const chatId = activeChat.id;
      const userMessage: ChatMessage = { id: nextId(), role: 'user', content: text };
      const assistantMessage: ChatMessage = { id: nextId(), role: 'assistant', content: '' };
      const history = [...activeChat.messages, userMessage]
        .filter((m) => !m.error && m.content)
        .map(({ role, content }) => ({ role, content }));

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: [...chat.messages, userMessage, assistantMessage] }
            : chat
        )
      );
      setInput('');
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const fail = (kind: ErrorKind) =>
        updateMessage(chatId, assistantMessage.id, { error: kind, content: '' });

      // Guests, and everyone when the API has no key, get answers built from the
      // portfolio data right here in the browser — no model call, no cost.
      const answerOffline = () =>
        streamLocally(
          answerLocally(text),
          (chunk) =>
            updateMessage(chatId, assistantMessage.id, (m) => ({ content: m.content + chunk })),
          controller.signal
        );

      try {
        if (account?.provider === 'guest' || offlineRef.current) {
          await answerOffline();
          return;
        }

        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(account?.apiKey ? { 'X-Anthropic-Key': account.apiKey } : {}),
          },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!res.ok) {
          let code = '';
          try {
            code = String(((await res.json()) as { error?: unknown }).error ?? '');
          } catch {
            /* non-JSON error body */
          }
          if (res.status === 503 && code === 'assistant_unconfigured') {
            offlineRef.current = true;
            await answerOffline();
          } else if (res.status === 401 && code === 'invalid_key') {
            // Their key was rejected: drop it and send them back to the gate to try again.
            saveAccount(null);
            setAccount(null);
            setGateError('Anthropic rejected that API key. Check it and try again.');
            fail('generic');
          } else if (res.status === 429) fail('rate_limited');
          else fail('generic');
          return;
        }

        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (chunk)
              updateMessage(chatId, assistantMessage.id, (m) => ({ content: m.content + chunk }));
          }
          const tail = decoder.decode();
          if (tail)
            updateMessage(chatId, assistantMessage.id, (m) => ({ content: m.content + tail }));
        } else {
          updateMessage(chatId, assistantMessage.id, { content: await res.text() });
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) fail('generic');
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStreaming(false);
      }
    },
    [activeChat, streaming, updateMessage, account]
  );

  function startNewChat() {
    if (isEmpty) return;
    abortRef.current?.abort();
    const chat = newChat();
    setChats((prev) => [chat, ...prev]);
    setActiveId(chat.id);
    setInput('');
  }

  function selectChat(id: string) {
    if (id === activeId) return;
    abortRef.current?.abort();
    setActiveId(id);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  function handleInput(value: string) {
    setInput(value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
    }
  }

  return (
    <div className={styles.root}>
      {!account && <SignInGate onSignIn={signIn} error={gateError} />}
      <aside className={styles.sidebar}>
        <button type="button" className={styles.newChat} onClick={startNewChat}>
          <span className={styles.rowIcon}>
            <PencilIcon />
          </span>
          New chat
        </button>
        <label className={styles.search}>
          <SearchIcon />
          <input
            type="search"
            placeholder="Search chats"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search chats"
          />
        </label>
        <div className={styles.sectionLabel}>Your chats</div>
        <div className={styles.chatList}>
          {visibleChats.length === 0 ? (
            <div className={styles.chatListEmpty}>
              {search ? 'No matching chats' : 'Chats from this session appear here'}
            </div>
          ) : (
            visibleChats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className={`${styles.chatRow} ${chat.id === activeId ? styles.chatRowActive : ''}`}
                onClick={() => selectChat(chat.id)}
              >
                <span className={styles.rowIcon}>
                  <ChatBubbleIcon />
                </span>
                <span className={styles.chatRowTitle}>{chatTitle(chat)}</span>
              </button>
            ))
          )}
        </div>
        {account && (
          <div className={styles.account}>
            <span className={styles.accountAvatar} aria-hidden="true">
              {account.provider === 'guest' ? 'G' : 'K'}
            </span>
            <span className={styles.accountName}>{account.name}</span>
            <button type="button" className={styles.signOut} onClick={signOut}>
              Sign out
            </button>
          </div>
        )}
      </aside>

      <section className={styles.main}>
        <header className={styles.header}>
          <span className={styles.modelChip} title="Powered by Claude">
            <span className={styles.modelChipIcon}>
              <img src="/icons/claude-symbol.png" alt="" width={12} height={12} draggable={false} />
            </span>
            Claude
            <svg
              viewBox="0 0 10 10"
              width="9"
              height="9"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            >
              <path d="M2.5 4l2.5 2.5L7.5 4" />
            </svg>
          </span>
          <button
            type="button"
            className={styles.headerNewChat}
            onClick={startNewChat}
            aria-label="New chat"
            title="New chat"
          >
            <PencilIcon />
          </button>
        </header>

        <div className={styles.messages} ref={listRef}>
          {isEmpty ? (
            <div className={styles.hero}>
              <img className={styles.heroIcon} src="/icons/claude.png" alt="" draggable={false} />
              <h1 className={styles.heroTitle}>Where should we begin?</h1>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={styles.suggestion}
                    onClick={() => void send(s)}
                    disabled={streaming}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.thread}>
              {activeChat.messages.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className={styles.userRow}>
                    <div className={styles.userBubble}>{m.content}</div>
                  </div>
                ) : (
                  <div key={m.id} className={styles.assistantRow}>
                    <img
                      className={styles.avatar}
                      src="/icons/claude-symbol.png"
                      alt=""
                      draggable={false}
                    />
                    <div className={styles.assistantBody}>
                      {m.error ? (
                        <div className={styles.note} role="status">
                          {ERROR_TEXT[m.error]}
                        </div>
                      ) : m.content ? (
                        <div className={styles.markdown}>{renderMarkdown(m.content)}</div>
                      ) : (
                        <div className={styles.typing} aria-label="Thinking">
                          <span />
                          <span />
                          <span />
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className={styles.composerWrap}>
          <div className={styles.composer}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              rows={1}
              placeholder="Ask anything about Josh…"
              aria-label="Ask anything about Josh"
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={() => void send(input)}
              disabled={streaming || input.trim() === ''}
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </div>
          <div className={styles.footnote}>
            Answers are based on Josh's portfolio and may occasionally be imperfect.
          </div>
        </div>
      </section>
    </div>
  );
}
