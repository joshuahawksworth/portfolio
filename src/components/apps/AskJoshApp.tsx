import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { answerLocally, streamLocally } from '../../lib/localAnswers';
import styles from './AskJoshApp.module.css';

type Role = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  error?: boolean;
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

const ERROR_TEXT = 'Something went wrong putting that answer together. Please try again.';
const MODEL = 'Sonnet 5.5';
/** Below this width the app lays out like the Claude phone app: drawer sidebar, docked composer. */
const NARROW_PX = 640;

/** Claude greets the signed-in user by first name and time of day. */
function greeting(now = new Date()): string {
  const h = now.getHours();
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return `Good ${part}, Joshua`;
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

// ── Icons (Claude's line icons, 1.5px strokes) ────────────────────────────────
function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
const PANEL = 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9 5v14';
const COMPOSE = 'M12 20h8M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z';
const CHATS = 'M21 12a8 8 0 0 1-11.6 7.2L4 20l1.2-4.4A8 8 0 1 1 21 12z';
const PLUS = 'M12 5v14M5 12h14';
const CHEVRON = 'M6 9l6 6 6-6';
const ARROW_UP = 'M12 19V5M5 12l7-7 7 7';
const COPY = 'M9 9h10v10H9zM5 15V5h10';
const RETRY = 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7';

// ── App ────────────────────────────────────────────────────────────────────────
export default function AskJoshApp() {
  const [chats, setChats] = useState<Chat[]>(() => [newChat()]);
  const [activeId, setActiveId] = useState(() => chats[0].id);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find((c) => c.id === activeId) ?? chats[0];
  const isEmpty = activeChat.messages.length === 0;
  const recents = chats.filter((c) => c.messages.length > 0);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < NARROW_PX));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

      try {
        // Every reply is built from the portfolio data right here in the browser: no model
        // call, no key to paste, nothing to configure.
        await streamLocally(
          answerLocally(text),
          (chunk) =>
            updateMessage(chatId, assistantMessage.id, (m) => ({ content: m.content + chunk })),
          controller.signal
        );
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError'))
          updateMessage(chatId, assistantMessage.id, { error: true, content: '' });
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStreaming(false);
      }
    },
    [activeChat, streaming, updateMessage]
  );

  function startNewChat() {
    setDrawerOpen(false);
    if (isEmpty) return;
    abortRef.current?.abort();
    const chat = newChat();
    setChats((prev) => [chat, ...prev]);
    setActiveId(chat.id);
    setInput('');
  }

  function selectChat(id: string) {
    setDrawerOpen(false);
    if (id === activeId) return;
    abortRef.current?.abort();
    setActiveId(id);
  }

  /** Re-ask the question that produced an assistant message. */
  function retry(messageId: string) {
    const i = activeChat.messages.findIndex((m) => m.id === messageId);
    const question = activeChat.messages
      .slice(0, i)
      .reverse()
      .find((m) => m.role === 'user');
    if (question) void send(question.content);
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

  const sidebarShown = narrow ? drawerOpen : sidebarOpen;
  const toggleSidebar = () => (narrow ? setDrawerOpen((o) => !o) : setSidebarOpen((o) => !o));

  const composer = (
    <div className={styles.composer}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        rows={1}
        placeholder={isEmpty ? 'How can I help you today?' : 'Reply to Claude…'}
        aria-label="Message Claude"
        value={input}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={streaming}
      />
      <div className={styles.composerBar}>
        <button
          type="button"
          className={styles.roundBtn}
          disabled
          aria-label="Attach"
          title="Attachments aren’t part of this demo"
        >
          <Icon d={PLUS} />
        </button>
        <span className={styles.spacer} />
        {!narrow && (
          <span className={styles.model}>
            {MODEL}
            <Icon d={CHEVRON} size={14} />
          </span>
        )}
        <button
          type="button"
          className={styles.sendBtn}
          onClick={() => void send(input)}
          disabled={streaming || input.trim() === ''}
          aria-label="Send"
        >
          <Icon d={ARROW_UP} size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.root} ref={rootRef} data-narrow={narrow || undefined}>
      {narrow && drawerOpen && (
        <div className={styles.scrim} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      )}
      <aside className={`${styles.sidebar} ${sidebarShown ? styles.sidebarShown : ''}`}>
        <div className={styles.sidebarTop}>
          <span className={styles.wordmark}>
            <img src="/icons/claude-symbol.png" alt="" width={18} height={18} draggable={false} />
            Claude
          </span>
          <button
            type="button"
            className={styles.roundBtn}
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <Icon d={PANEL} />
          </button>
        </div>
        <button type="button" className={styles.navRow} onClick={startNewChat}>
          <span className={styles.plusDisc}>
            <Icon d={PLUS} size={14} />
          </span>
          New chat
        </button>
        <button type="button" className={styles.navRow} onClick={startNewChat}>
          <span className={styles.navIcon}>
            <Icon d={CHATS} />
          </span>
          Chats
        </button>
        <div className={styles.sectionLabel}>Recents</div>
        <div className={styles.chatList}>
          {recents.length === 0 ? (
            <div className={styles.chatListEmpty}>Chats from this session appear here</div>
          ) : (
            recents.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className={`${styles.chatRow} ${chat.id === activeId ? styles.chatRowActive : ''}`}
                onClick={() => selectChat(chat.id)}
              >
                {chatTitle(chat)}
              </button>
            ))
          )}
        </div>
        <div className={styles.account}>
          <span className={styles.accountAvatar}>JH</span>
          <span className={styles.accountName}>
            Joshua Hawksworth
            <small>Free plan</small>
          </span>
        </div>
      </aside>

      <section className={styles.main}>
        <header className={styles.header}>
          {(narrow || !sidebarOpen) && (
            <button
              type="button"
              className={styles.roundBtn}
              onClick={toggleSidebar}
              aria-label="Open sidebar"
            >
              <Icon d={PANEL} />
            </button>
          )}
          <span className={styles.headerTitle}>
            {narrow ? (
              <>
                {MODEL}
                <Icon d={CHEVRON} size={14} />
              </>
            ) : (
              !isEmpty && chatTitle(activeChat)
            )}
          </span>
          {narrow && (
            <button
              type="button"
              className={styles.roundBtn}
              onClick={startNewChat}
              aria-label="New chat"
            >
              <Icon d={COMPOSE} />
            </button>
          )}
        </header>

        <div className={styles.messages} ref={listRef}>
          {isEmpty ? (
            <div className={styles.hero}>
              <img
                className={styles.heroIcon}
                src="/icons/claude-symbol.png"
                alt=""
                draggable={false}
              />
              <h1 className={styles.heroTitle}>{greeting()}</h1>
              {!narrow && composer}
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
                    {m.error ? (
                      <div className={styles.note} role="status">
                        {ERROR_TEXT}
                      </div>
                    ) : m.content ? (
                      <>
                        <div className={styles.markdown}>{renderMarkdown(m.content)}</div>
                        {!streaming && (
                          <div className={styles.actions}>
                            <button
                              type="button"
                              className={styles.roundBtn}
                              onClick={() => void navigator.clipboard?.writeText(m.content)}
                              aria-label="Copy"
                              title="Copy"
                            >
                              <Icon d={COPY} size={16} />
                            </button>
                            <button
                              type="button"
                              className={styles.roundBtn}
                              onClick={() => retry(m.id)}
                              aria-label="Retry"
                              title="Retry"
                            >
                              <Icon d={RETRY} size={16} />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <img
                        className={styles.thinking}
                        src="/icons/claude-symbol.png"
                        alt=""
                        aria-label="Thinking"
                        data-essential-motion=""
                      />
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {(!isEmpty || narrow) && (
          <div className={styles.composerWrap}>
            {composer}
            {!narrow && (
              <div className={styles.footnote}>
                Claude can make mistakes. Please double-check responses.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
