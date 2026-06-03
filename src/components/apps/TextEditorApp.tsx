import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import styles from './TextEditorApp.module.css';

// ── Syntax highlighting ────────────────────────────────────────────────────

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const JS_KEYWORDS = /\b(const|let|var|function|return|if|else|while|for|of|in|new|class|extends|import|export|default|from|async|await|try|catch|finally|throw|typeof|instanceof|void|null|undefined|true|false|this|super|type|interface|enum|readonly|abstract|implements|declare|namespace|module|require|yield|delete|switch|case|break|continue|do|with|debugger|get|set|static)\b/g;

function highlightJS(code: string): string {
  // Tokenise line by line to handle multi-line strings simply
  return code.split('\n').map(line => {
    const esc = escHtml(line);
    return esc
      // Line comments
      .replace(/(&lt;|&gt;|[^:])(\/\/.*)$/g, (_, pre, cmt) => `${pre}<span class="cm">${cmt}</span>`)
      // Template literals — crude single-line
      .replace(/(`[^`]*`)/g, '<span class="st">$1</span>')
      // Strings
      .replace(/(["'])((?:[^\\]|\\.)*?)\1/g, '<span class="st">$1$2$1</span>')
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="nm">$1</span>')
      // Keywords
      .replace(JS_KEYWORDS, '<span class="kw">$1</span>')
      // Type annotations (TS: after : or <)
      .replace(/(?<=:\s*)([A-Z][a-zA-Z0-9]*)/g, '<span class="tp">$1</span>');
  }).join('\n');
}

function highlightMD(code: string): string {
  return code.split('\n').map(line => {
    const esc = escHtml(line);
    if (/^#{1,6} /.test(line)) return `<span class="kw">${esc}</span>`;
    if (/^\s*[-*+] /.test(line)) return esc.replace(/^(\s*[-*+] )/, '<span class="nm">$1</span>');
    if (/^\s*\d+\. /.test(line)) return esc.replace(/^(\s*\d+\. )/, '<span class="nm">$1</span>');
    return esc
      .replace(/(`[^`]+`)/g, '<span class="st">$1</span>')
      .replace(/(\*\*[^*]+\*\*)/g, '<span class="tp">$1</span>')
      .replace(/(\*[^*]+\*)/g, '<span class="cm">$1</span>');
  }).join('\n');
}

function highlightHTML(code: string): string {
  return escHtml(code)
    .replace(/(&lt;\/?[a-zA-Z][a-zA-Z0-9-]*)/g, '<span class="kw">$1</span>')
    .replace(/([a-zA-Z-]+=)(["'][^"']*["'])/g, '<span class="tp">$1</span><span class="st">$2</span>')
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="cm">$1</span>');
}

function highlight(code: string, ext: string): string {
  if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return highlightJS(code);
  if (ext === 'md') return highlightMD(code);
  if (ext === 'html' || ext === 'htm') return highlightHTML(code);
  return escHtml(code);
}

// ── Static file contents for Finder files ─────────────────────────────────
export const FINDER_FILE_CONTENTS: Record<string, { content: string; filename: string }> = {
  'doc-readme': {
    filename: 'README.md',
    content: `# Joshua Hawksworth

Senior Full Stack Developer | Manchester, UK

6+ years building React & React Native applications across
multiple industries. Specialising in TypeScript, React.js,
and mobile development.

## Contact
- Email: joshuahawksworth@me.com
- GitHub: github.com/joshuahawksworth
- LinkedIn: linkedin.com/in/joshuahawksworth

## Tech Stack
- **Frontend**: React, React Native, TypeScript, Vue.js
- **Backend**: Node.js, NestJS, Laravel (PHP)
- **Database**: PostgreSQL, MySQL, Redis
- **Cloud**: Azure, Docker
`,
  },
  'doc-notes': {
    filename: 'Notes.txt',
    content: `TODO:
- Learn .NET Blazor (in progress)
- Finish automotive side project with dad
- Win game jam
- Let Jiji stop breaking the keyboard

READING LIST:
- Clean Architecture - Robert C. Martin
- Designing Data-Intensive Applications
- The Pragmatic Programmer

RANDOM THOUGHTS:
- CSS is a programming language (fight me)
- TypeScript strict mode should be the default
- Dark mode is a personality trait at this point
`,
  },
  'cmap-readme': {
    filename: 'README.md',
    content: `# cmap-mail

Email client integration for CMap Software's project
management platform.

## Overview
Integrated email threading, contact lookup and
automated project assignment directly into the
CMap Software dashboard.

## Tech Stack
- React + TypeScript
- NestJS REST API
- Microsoft Graph API (Outlook integration)
- Azure App Service

## Features
- Real-time email sync
- Thread management
- Contact auto-complete
- Project tag assignment
`,
  },
  'kwa-readme': {
    filename: 'README.md',
    content: `# Kwando

Mobile commerce platform for independent retailers.

## Overview
React Native app for iOS & Android enabling small
businesses to manage stock, orders and customer
relationships on the go.

## Tech Stack
- React Native + TypeScript
- Node.js + Express backend
- PostgreSQL
- Stripe payments

## Status
Active development — v2.1.0
`,
  },
  'kwa-app': {
    filename: 'App.tsx',
    content: `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import ProductScreen from './screens/ProductScreen';
import CartScreen from './screens/CartScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Product" component={ProductScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
`,
  },
  'ord-readme': {
    filename: 'README.md',
    content: `# OrderBee

Order management SaaS for hospitality businesses.

## Overview
Web application for restaurants and bars to manage
table orders, kitchen queues and staff assignments.

## Tech Stack
- Vue.js + Vuex
- Laravel (PHP) REST API
- MySQL
- Laravel Echo + Pusher (real-time)

## Key Features
- Real-time order board
- Table plan management
- Kitchen display system
- End-of-day reporting
`,
  },
  'ord-index': {
    filename: 'index.js',
    content: `const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('order:create', (order) => {
    // Broadcast to kitchen display
    io.to('kitchen').emit('order:new', order);
  });

  socket.on('order:update', ({ id, status }) => {
    io.emit('order:status', { id, status });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(3001);
`,
  },
  'tofs-readme': {
    filename: 'README.md',
    content: `# TOFS App (The Old Fashioned Store)

E-commerce platform for TOFS, Manchester's iconic
vintage toy and collectibles store.

## Overview
Full-stack e-commerce rebuild replacing legacy
system with modern React frontend and headless CMS.

## Tech Stack
- React + TypeScript
- Next.js (SSR/SSG)
- Contentful CMS
- Stripe payments
- Vercel deployment

## Highlights
- 40% improvement in Core Web Vitals
- Reduced page load from 8s → 1.2s
- Mobile-first redesign
`,
  },
  'ciclo-readme': {
    filename: 'README.md',
    content: `# CicloZone

Cycling route tracking and community platform.

## Overview
Mobile-first web app for tracking cycling routes,
sharing rides and connecting with the local cycling
community around Manchester.

## Tech Stack
- React + TypeScript
- Mapbox GL JS
- Node.js + GraphQL
- PostgreSQL + PostGIS

## Status
Personal project — ongoing
`,
  },
  'web-readme': {
    filename: 'README.md',
    content: `# Webmaster (17 Oranges)

Internal content management tools for 17 Oranges'
portfolio of motorsport media properties.

## Overview
Bespoke CMS and editorial tooling for managing
race results, driver profiles and event coverage
across multiple motorsport websites.

## Tech Stack
- PHP + Laravel
- Vue.js frontend
- MySQL
- AWS S3 (media storage)
`,
  },
  'web-index': {
    filename: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Webmaster | 17 Oranges</title>
  <link rel="stylesheet" href="/css/app.css" />
</head>
<body>
  <div id="app">
    <!-- Vue.js app mounts here -->
  </div>
  <script src="/js/app.js"></script>
</body>
</html>
`,
  },
  'dl-blazor': {
    filename: 'dotnet-blazor.pdf',
    content: `[PDF Document]

.NET Blazor — Getting Started Guide

This document cannot be rendered as plain text.
It's a PDF file about .NET Blazor WebAssembly development.

Topics covered:
• Introduction to Blazor WebAssembly
• Component model and lifecycle
• State management with Fluxor
• JavaScript interop
• Authentication with ASP.NET Identity
• Deployment to Azure Static Web Apps

To view this PDF, use the "Open in new tab" link below.
`,
  },
  'dl-react': {
    filename: 'react-19-guide.pdf',
    content: `[PDF Document]

React 19 — What's New and How to Upgrade

This document cannot be rendered as plain text.
It's a PDF about React 19 features and migration.

Topics covered:
• Server Components (stable)
• Actions and useOptimistic
• use() hook
• ref as a prop (no more forwardRef)
• Improved hydration error messages
• Asset loading APIs
• Document metadata APIs

To view this PDF, use the "Open in new tab" link below.
`,
  },

  // Extra files with content
  'cmap-pkg': {
    filename: 'package.json',
    content: `{
  "name": "cmap-mail",
  "version": "1.4.0",
  "description": "Email integration for CMap Software",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "axios": "^1.6.0",
    "dayjs": "^1.11.10",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.0",
    "vitest": "^1.2.0"
  }
}
`,
  },
  'cmap-src': {
    filename: 'src/',
    content: `// src/ directory
//
// EmailList.tsx    — threaded inbox component
// EmailThread.tsx  — full conversation view
// Composer.tsx     — new message modal
// ContactPicker.tsx — address autocomplete
// useGraphMail.ts  — Microsoft Graph hook
// api.ts           — REST client
`,
  },
  'tofs-src': {
    filename: 'src/',
    content: `// src/ directory
//
// pages/
//   index.tsx      — homepage (SSG)
//   shop/[slug].tsx — product pages (ISR)
//   cart.tsx       — shopping cart
//   checkout.tsx   — Stripe checkout
// components/
//   ProductCard.tsx
//   CartDrawer.tsx
//   Header.tsx
// lib/
//   contentful.ts  — Contentful API client
//   stripe.ts      — Stripe helpers
`,
  },
  // Joke trash items — same ids as JOKE_TRASH in DesktopContext
  'joke-jquery': {
    filename: 'jQuery.js',
    content: `// jQuery v1.11.3 — "Because we had no choice"
(function( global, factory ) {
  if ( typeof module === 'object' ) {
    module.exports = factory( global );
  } else {
    factory( global );
  }
}(window, function( window ) {
  // TODO: migrate to vanilla JS... next sprint, promise
  console.log('jQuery loaded. I am so sorry.');
}));`,
  },
  'joke-index': {
    filename: 'index2_FINAL_v3.html',
    content: `<!DOCTYPE html>
<html>
<head>
  <title>My Portfolio (FINAL - this is the real one)</title>
  <!-- index.html was the draft -->
  <!-- index_v2.html was the "good" draft -->
  <!-- this one is FINAL. Do NOT edit. -->
  <!-- note: edited 47 times since calling it FINAL -->
</head>
<body>
  <h1>Hi, I am a developer</h1>
  <!-- TODO: say something more interesting -->
</body>
</html>`,
  },
  'joke-spaghetti': {
    filename: 'spaghetti-code.ts',
    content: `// Written at 2am before a deadline
// Do not touch. It works. Nobody knows why.

export function doTheThing(x: any, y?: any, z?: any) {
  if (x) {
    if (y) {
      if (z) { return x + y + z; // trust me
      } else { return x + y; }
    } else {
      if (z) { return x + z; }
    }
  } else {
    if (y && z) { return y + z || x || 0; // don't ask
    }
  }
  return null; // :)
}`,
  },
  'joke-confusion': {
    filename: 'var let const confusion.txt',
    content: `My notes on JavaScript variable declarations:

var   - hoisted, function-scoped, can be redeclared. Why? ¯\\_(ツ)_/¯
let   - block-scoped, temporal dead zone. OK actually fine.
const - block-scoped, immutable binding (not the value!). Use this.

TODO: stop using var
Status: still using var in production (2020)
Status: still using var in production (2021)
Status: stopped, had a stern talk with myself`,
  },
  'joke-console': {
    filename: 'console.log("here").js',
    content: `// Debug session: 3 hours, 47 minutes
// Root cause: off-by-one error in line 12

console.log("here");
console.log("here 2");
console.log("HERE");
console.log("HERE??");
console.log("why");
console.log(data);
// spoiler: it was not the API
console.log(typeof undefined); // "undefined" ← found it`,
  },
  'joke-todo': {
    filename: 'TODO_do_this_later.md',
    content: `# TODO: Do This Later

Created: January 2024

## High Priority
- [ ] Refactor auth module
- [ ] Write tests (lol)
- [ ] Update dependencies

## Medium Priority
- [ ] Do the thing from last sprint
- [ ] Reply to that Slack message

## Low Priority (realistically: never)
- [ ] Document everything
- [ ] Remove all console.logs
- [ ] Actually learn Docker properly

---
*Est. completion: Q3 2024*
*Actual completion: ¯\\_(ツ)_/¯*`,
  },
};

// ── File save helpers ──────────────────────────────────────────────────────

const MIME_MAP: Record<string, string> = {
  ts: 'application/typescript', tsx: 'application/typescript',
  js: 'application/javascript', jsx: 'application/javascript',
  json: 'application/json', html: 'text/html', css: 'text/css',
  md: 'text/markdown', txt: 'text/plain', py: 'text/x-python',
  sh: 'application/x-sh', xml: 'application/xml',
};

const FORMAT_LABELS: Record<string, string> = {
  md: 'Markdown', txt: 'Plain Text', ts: 'TypeScript', tsx: 'TypeScript JSX',
  js: 'JavaScript', jsx: 'JavaScript JSX', json: 'JSON', html: 'HTML',
  css: 'CSS', py: 'Python', sh: 'Shell Script', xml: 'XML',
};

async function saveFileToDisk(name: string, text: string): Promise<'saved' | 'cancelled' | 'fallback'> {
  const ext = name.split('.').pop()?.toLowerCase() ?? 'txt';
  const mime = MIME_MAP[ext] ?? 'text/plain';

  // Try native File System Access API (Chrome/Edge)
  if ('showSaveFilePicker' in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: name,
        types: [{ description: FORMAT_LABELS[ext] ?? 'Text file', accept: { [mime]: [`.${ext}`] } }],
        startIn: 'desktop',
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return 'saved';
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return 'cancelled';
      // Fall through to blob download on other errors
    }
  }

  // Blob download fallback (all browsers)
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return 'fallback';
}

// ── Session content store — persists edits across close/reopen ────────────
// Module-level: lives for the whole browser session (SPA, no page reload needed)
const sessionFileStore = new Map<string, string>();

// ── Component ──────────────────────────────────────────────────────────────

export default function TextEditorApp({ props }: { props?: Record<string, unknown> }) {
  const initFilename = (props?.filename as string) ?? 'untitled.txt';
  const initContent  = (props?.content  as string) ?? '';
  // fileId is a stable key (Finder item ID) so edits survive rename in the store
  const fileId       = (props?.fileId   as string | undefined) ?? initFilename;

  // On first render: check session store, fall back to props content
  const [filename, setFilename] = useState(initFilename);
  const [content,  setContent]  = useState(() => sessionFileStore.get(fileId) ?? initContent);
  const [dirty,    setDirty]    = useState(() => sessionFileStore.has(fileId));

  // Save sheet state
  const [saveSheet,     setSaveSheet]     = useState(false);
  const [saveName,      setSaveName]      = useState(initFilename);
  const [saveStatus,    setSaveStatus]    = useState<'idle' | 'saving' | 'done' | 'fallback'>('idle');
  const saveNameRef = useRef<HTMLInputElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hlRef       = useRef<HTMLDivElement>(null);
  const lineNumRef  = useRef<HTMLDivElement>(null);

  const ext       = filename.split('.').pop()?.toLowerCase() ?? '';
  const saveExt   = saveName.split('.').pop()?.toLowerCase() ?? '';

  const highlighted = useMemo(() => highlight(content, ext), [content, ext]);
  const lineCount   = content.split('\n').length;

  // ── Local save — instant, no dialog ──────────────────────────────────
  const [savedFlash, setSavedFlash] = useState(false);
  function localSave() {
    sessionFileStore.set(fileId, content);
    setDirty(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
  }

  // ── Export sheet — triggers actual file download ──────────────────────
  function openSaveSheet() {
    setSaveName(filename);
    setSaveStatus('idle');
    setSaveSheet(true);
    setTimeout(() => {
      saveNameRef.current?.focus();
      saveNameRef.current?.select();
    }, 60);
  }

  const doSave = useCallback(async (nameOverride?: string) => {
    const name = (nameOverride ?? saveName).trim() || 'untitled.txt';
    setSaveStatus('saving');
    const result = await saveFileToDisk(name, content);
    if (result === 'cancelled') {
      setSaveStatus('idle');
      return;
    }
    // Keep store up-to-date under the new name
    sessionFileStore.set(fileId, content);
    setFilename(name);
    setSaveStatus(result === 'fallback' ? 'fallback' : 'done');
    setDirty(false);
    setTimeout(() => {
      setSaveSheet(false);
      setSaveStatus('idle');
    }, 1800);
  }, [fileId, saveName, content]);

  // Sync scroll between textarea and highlight overlay
  function syncScroll() {
    if (!hlRef.current || !textareaRef.current || !lineNumRef.current) return;
    hlRef.current.scrollTop      = textareaRef.current.scrollTop;
    hlRef.current.scrollLeft     = textareaRef.current.scrollLeft;
    lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    sessionFileStore.set(fileId, val);
    setDirty(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta    = e.currentTarget;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      setContent(content.slice(0, start) + '  ' + content.slice(end));
      setDirty(true);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      localSave();
    }
  }

  // When the same window is pointed at a new file (rare), reset accordingly
  useEffect(() => {
    const stored = sessionFileStore.get(fileId);
    setFilename(initFilename);
    setContent(stored ?? initContent);
    setDirty(!!stored);
    setSaveSheet(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  // Close sheet on Escape
  useEffect(() => {
    if (!saveSheet) return;
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') { setSaveSheet(false); setSaveStatus('idle'); }
      if (e.key === 'Enter' && saveStatus === 'idle') doSave();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveSheet, saveStatus, doSave]);

  return (
    <div className={styles.root}>
      {/* Tab bar */}
      <div className={styles.tabBar}>
        <div className={`${styles.tab} ${dirty ? styles.tabDirty : ''}`}>
          {dirty && <span className={styles.tabDot} />}
          {filename}
        </div>
        {/* Saved flash */}
        {savedFlash && <span className={styles.savedFlash}>Saved ✓</span>}

        {/* Export to disk */}
        <button
          className={styles.saveTabBtn}
          onClick={openSaveSheet}
          title="Export file to disk"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 2v7M4 6.5l3 3 3-3"/><path d="M2 12h10"/>
          </svg>
          Export
        </button>
      </div>

      {/* Editor */}
      <div className={styles.editorArea}>
        <div ref={lineNumRef} className={styles.lineNumbers} aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className={styles.lineNum}>{i + 1}</div>
          ))}
        </div>
        <div className={styles.codeWrap}>
          <div
            ref={hlRef}
            className={styles.highlight}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
          />
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder="// Start typing…"
          />
        </div>
      </div>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <span className={styles.statusLang}>{ext.toUpperCase() || 'TXT'}</span>
        <span className={styles.statusSep} />
        <span>{lineCount} lines</span>
        <span className={styles.statusSep} />
        <span>{content.length} chars</span>
        <span className={styles.statusFill} />
        <span className={styles.statusHint}>⌘S to save</span>
      </div>

      {/* ── Save sheet ──────────────────────────────────────────────── */}
      {saveSheet && (
        <div className={styles.sheetOverlay} onClick={() => { setSaveSheet(false); setSaveStatus('idle'); }}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>

            {saveStatus === 'done' || saveStatus === 'fallback' ? (
              /* Success state */
              <div className={styles.sheetSuccess}>
                <div className={styles.sheetSuccessIcon}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="14" fill="rgba(48,209,88,0.18)" stroke="#30d158" strokeWidth="1.5"/>
                    <path d="M10 16l4 4 8-8" stroke="#30d158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.sheetSuccessTitle}>File saved</div>
                <div className={styles.sheetSuccessName}>{saveName}</div>
                {saveStatus === 'fallback' && (
                  <div className={styles.sheetSuccessHint}>Saved to your Downloads folder</div>
                )}
              </div>
            ) : (
              /* Save form */
              <>
                <div className={styles.sheetHeader}>
                  <div className={styles.sheetIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18H5a1.5 1.5 0 01-1.5-1.5v-13A1.5 1.5 0 015 2h7.5L16.5 6v10.5A1.5 1.5 0 0115 18z"/>
                      <path d="M13 2v5H7V2M7 18v-6h6v6"/>
                    </svg>
                  </div>
                  <div>
                    <div className={styles.sheetTitle}>Export File</div>
                    <div className={styles.sheetSubtitle}>
                      Download a copy to your Desktop or chosen folder
                    </div>
                  </div>
                </div>

                <div className={styles.sheetFields}>
                  <label className={styles.sheetLabel}>Filename</label>
                  <input
                    ref={saveNameRef}
                    className={styles.sheetInput}
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <div className={styles.sheetMeta}>
                    <span className={styles.sheetMetaPill}>
                      {FORMAT_LABELS[saveExt] ?? (saveExt.toUpperCase() || 'Text file')}
                    </span>
                    <span className={styles.sheetMetaSize}>
                      {content.length < 1024
                        ? `${content.length} bytes`
                        : `${(content.length / 1024).toFixed(1)} KB`}
                    </span>
                  </div>
                </div>

                {'showSaveFilePicker' in window ? (
                  <div className={styles.sheetHint}>
                    Your browser supports native save — you can choose the Desktop or any folder.
                  </div>
                ) : (
                  <div className={styles.sheetHint}>
                    File will download to your browser's default downloads folder.
                  </div>
                )}

                <div className={styles.sheetActions}>
                  <button
                    className={styles.sheetCancel}
                    onClick={() => { setSaveSheet(false); setSaveStatus('idle'); }}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.sheetSave}
                    onClick={() => doSave()}
                    disabled={saveStatus === 'saving'}
                  >
                    {saveStatus === 'saving' ? (
                      'Saving…'
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 2v8M4 7l3 3 3-3"/>
                          <path d="M2 12h10"/>
                        </svg>
                        Export File
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
