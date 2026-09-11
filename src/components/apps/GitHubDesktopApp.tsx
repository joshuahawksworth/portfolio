/**
 * GitHub Desktop, wired to the real GitHub API for joshuahawksworth's public repos:
 * the repository picker, the History tab (real commits) and a commit's changed files.
 * Fetching, pushing and branching are shown but disabled; the real app does those.
 */
import { useEffect, useMemo, useState } from 'react';
import { useDesktop } from '../../context/DesktopContext';
import styles from './GitHubDesktopApp.module.css';

const OWNER = 'joshuahawksworth';
const API = 'https://api.github.com';

interface Repo {
  name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  pushed_at: string;
  stargazers_count: number;
}

interface Commit {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } };
  author: { login: string; avatar_url: string } | null;
}

interface CommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
}

/** Shown when GitHub's unauthenticated rate limit (60 requests an hour) is spent. */
const FALLBACK_REPOS: Repo[] = [
  {
    name: 'portfolio',
    description: 'A macOS desktop in the browser: this site.',
    html_url: `https://github.com/${OWNER}/portfolio`,
    default_branch: 'main',
    language: 'TypeScript',
    pushed_at: new Date().toISOString(),
    stargazers_count: 0,
  },
];

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(res.status === 403 ? 'rate-limited' : `HTTP ${res.status}`);
  return (await res.json()) as T;
}

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'} ago`;
  if (s < 3600) return unit(Math.max(1, Math.round(s / 60)), 'minute');
  if (s < 86400) return unit(Math.round(s / 3600), 'hour');
  if (s < 86400 * 30) return unit(Math.round(s / 86400), 'day');
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const LANG_COLOURS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  PHP: '#4f5d95',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Vue: '#41b883',
};

export default function GitHubDesktopApp() {
  const { openApp } = useDesktop();
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [current, setCurrent] = useState<string>('portfolio');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tab, setTab] = useState<'changes' | 'history'>('history');
  const [commits, setCommits] = useState<Commit[] | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [selectedSha, setSelectedSha] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, CommitFile[] | 'loading' | 'error'>>({});
  const [fetchState, setFetchState] = useState<'idle' | 'fetching' | 'done'>('idle');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getJson<Repo[]>(`${API}/users/${OWNER}/repos?sort=pushed&per_page=30`)
      .then((list) => {
        if (cancelled) return;
        setRepos(list);
        if (!list.some((r) => r.name === current) && list[0]) setCurrent(list[0].name);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setRepos(FALLBACK_REPOS);
        setRepoError(err.message);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const repo = useMemo(() => repos?.find((r) => r.name === current) ?? null, [repos, current]);

  useEffect(() => {
    if (!repo) return;
    let cancelled = false;
    setCommits(null);
    setCommitError(null);
    setSelectedSha(null);
    getJson<Commit[]>(`${API}/repos/${OWNER}/${repo.name}/commits?per_page=40`)
      .then((list) => {
        if (cancelled) return;
        setCommits(list);
        setSelectedSha(list[0]?.sha ?? null);
      })
      .catch((err: Error) => {
        if (!cancelled) setCommitError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  useEffect(() => {
    if (!repo || !selectedSha || files[selectedSha]) return;
    setFiles((prev) => ({ ...prev, [selectedSha]: 'loading' }));
    getJson<{ files?: CommitFile[] }>(`${API}/repos/${OWNER}/${repo.name}/commits/${selectedSha}`)
      .then((c) => setFiles((prev) => ({ ...prev, [selectedSha]: c.files ?? [] })))
      .catch(() => setFiles((prev) => ({ ...prev, [selectedSha]: 'error' })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, selectedSha]);

  function say(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(null), 2600);
  }

  function fetchOrigin() {
    if (fetchState === 'fetching') return;
    setFetchState('fetching');
    window.setTimeout(() => {
      setFetchState('done');
      say(
        'Already up to date — this is a browser copy of GitHub Desktop. Cloning, fetching and pushing need the real app.'
      );
    }, 900);
  }

  const selected = commits?.find((c) => c.sha === selectedSha) ?? null;
  const selectedFiles = selectedSha ? files[selectedSha] : undefined;

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${styles.toolItem} ${pickerOpen ? styles.toolItemOpen : ''}`}
          onClick={() => setPickerOpen((o) => !o)}
          aria-expanded={pickerOpen}
        >
          <span className={styles.toolGlyph} aria-hidden="true">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
            </svg>
          </span>
          <span className={styles.toolText}>
            <span className={styles.toolLabel}>Current repository</span>
            <span className={styles.toolValue}>{repo?.name ?? 'Loading…'}</span>
          </span>
          <span className={styles.toolChevron}>▾</span>
        </button>
        <button
          type="button"
          className={styles.toolItem}
          onClick={() => say('Branches are managed in the real GitHub Desktop.')}
        >
          <span className={styles.toolGlyph} aria-hidden="true">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
            </svg>
          </span>
          <span className={styles.toolText}>
            <span className={styles.toolLabel}>Current branch</span>
            <span className={styles.toolValue}>{repo?.default_branch ?? 'main'}</span>
          </span>
          <span className={styles.toolChevron}>▾</span>
        </button>
        <button
          type="button"
          className={`${styles.toolItem} ${styles.toolItemGrow}`}
          onClick={fetchOrigin}
        >
          <span
            className={`${styles.toolGlyph} ${fetchState === 'fetching' ? styles.spin : ''}`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
            </svg>
          </span>
          <span className={styles.toolText}>
            <span className={styles.toolLabel}>
              {fetchState === 'fetching' ? 'Fetching…' : 'Fetch origin'}
            </span>
            <span className={styles.toolValue}>
              {fetchState === 'done'
                ? 'Last fetched just now'
                : repo
                  ? `Last fetched ${ago(repo.pushed_at)}`
                  : ''}
            </span>
          </span>
        </button>
        {pickerOpen && (
          <div className={styles.picker}>
            <div className={styles.pickerHead}>
              <span>Repositories</span>
              {repoError && <span className={styles.pickerWarn}>offline list</span>}
            </div>
            {(repos ?? []).map((r) => (
              <button
                key={r.name}
                type="button"
                className={`${styles.pickerRow} ${r.name === current ? styles.pickerRowActive : ''}`}
                onClick={() => {
                  setCurrent(r.name);
                  setPickerOpen(false);
                }}
              >
                <span className={styles.pickerName}>{r.name}</span>
                {r.language && (
                  <span className={styles.pickerLang}>
                    <span
                      className={styles.langDot}
                      style={{ background: LANG_COLOURS[r.language] ?? '#8b949e' }}
                    />
                    {r.language}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.body}>
        {/* Left pane */}
        <div className={styles.left}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'changes' ? styles.tabActive : ''}`}
              onClick={() => setTab('changes')}
            >
              Changes
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'history' ? styles.tabActive : ''}`}
              onClick={() => setTab('history')}
            >
              History
            </button>
          </div>

          {tab === 'history' ? (
            <div className={styles.commitList}>
              {commitError ? (
                <div className={styles.note}>
                  {commitError === 'rate-limited'
                    ? "GitHub's public API limit for this network is used up for the hour. The repository is still on GitHub — open it below."
                    : `Couldn't load commits (${commitError}).`}
                </div>
              ) : !commits ? (
                <div className={styles.note}>Loading history…</div>
              ) : (
                commits.map((c) => {
                  const [title] = c.commit.message.split('\n');
                  return (
                    <button
                      key={c.sha}
                      type="button"
                      className={`${styles.commit} ${c.sha === selectedSha ? styles.commitActive : ''}`}
                      onClick={() => setSelectedSha(c.sha)}
                    >
                      <span className={styles.commitTitle}>{title}</span>
                      <span className={styles.commitMeta}>
                        {c.author?.avatar_url ? (
                          <img src={c.author.avatar_url} alt="" className={styles.avatar} />
                        ) : (
                          <span className={styles.avatarFallback} />
                        )}
                        {c.commit.author.name} · {ago(c.commit.author.date)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className={styles.changes}>
              <div className={styles.changesHead}>0 changed files</div>
              <div className={styles.note}>
                Nothing to commit — the working copy on this Mac is clean. Edit something in Visual
                Studio Code and the real GitHub Desktop would list it here.
              </div>
              <div className={styles.commitForm}>
                <div className={styles.formAuthor}>
                  <span className={styles.avatarFallback}>JH</span>
                  <input
                    className={styles.summaryInput}
                    placeholder="Summary (required)"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>
                <textarea
                  className={styles.descInput}
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.commitBtn}
                  disabled={summary.trim() === ''}
                  onClick={() =>
                    say(
                      'Committing needs a real clone. Install GitHub Desktop and the same button does it for real.'
                    )
                  }
                >
                  Commit to {repo?.default_branch ?? 'main'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right pane */}
        <div className={styles.right}>
          {tab === 'history' && selected ? (
            <>
              <div className={styles.detailHead}>
                <h3 className={styles.detailTitle}>{selected.commit.message.split('\n')[0]}</h3>
                <div className={styles.detailMeta}>
                  {selected.author?.avatar_url && (
                    <img src={selected.author.avatar_url} alt="" className={styles.avatar} />
                  )}
                  <span>
                    <strong>{selected.commit.author.name}</strong> committed{' '}
                    {ago(selected.commit.author.date)}
                  </span>
                  <code className={styles.sha}>{selected.sha.slice(0, 7)}</code>
                </div>
                {selected.commit.message.includes('\n') && (
                  <pre className={styles.detailBody}>
                    {selected.commit.message.split('\n').slice(1).join('\n').trim()}
                  </pre>
                )}
              </div>
              <div className={styles.fileList}>
                {selectedFiles === 'loading' || selectedFiles === undefined ? (
                  <div className={styles.note}>Loading changed files…</div>
                ) : selectedFiles === 'error' ? (
                  <div className={styles.note}>Changed files aren't available right now.</div>
                ) : (
                  <>
                    <div className={styles.fileHead}>{selectedFiles.length} changed files</div>
                    {selectedFiles.map((f) => (
                      <div key={f.filename} className={styles.fileRow}>
                        <span
                          className={`${styles.fileStatus} ${styles[`status_${f.status}`] ?? ''}`}
                        >
                          {f.status === 'added'
                            ? 'A'
                            : f.status === 'removed'
                              ? 'D'
                              : f.status === 'renamed'
                                ? 'R'
                                : 'M'}
                        </span>
                        <span className={styles.fileName}>{f.filename}</span>
                        <span className={styles.fileDiff}>
                          <span className={styles.plus}>+{f.additions}</span>{' '}
                          <span className={styles.minus}>−{f.deletions}</span>
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className={styles.emptyRight}>
              <div className={styles.emptyMark} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </div>
              <h3>{tab === 'changes' ? 'No local changes' : 'Select a commit'}</h3>
              <p>{repo?.description ?? 'Pick a repository to see its history.'}</p>
              {repo && (
                <div className={styles.emptyActions}>
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={() => openApp('safari', { url: repo.html_url })}
                  >
                    View on GitHub
                  </button>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => openApp('texteditor')}
                  >
                    Open in Visual Studio Code
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
