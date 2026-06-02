import { useState, useEffect } from 'react';
import styles from './SafariApp.module.css';

const GITHUB_USER = 'joshuahawksworth';
const GITHUB_URL  = `https://github.com/${GITHUB_USER}`;

interface GHProfile {
  name: string;
  login: string;
  bio: string;
  location: string;
  blog: string;
  avatar_url: string;
  followers: number;
  following: number;
  public_repos: number;
}

interface GHRepo {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  html_url: string;
  updated_at: string;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', 'C#': '#178600',
  Python: '#3572A5', Go: '#00ADD8', Rust: '#dea584', CSS: '#563d7c',
  HTML: '#e34c26',
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 1)  return 'today';
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function SafariApp({ props: _ }: { props?: Record<string, unknown> }) {
  const [profile, setProfile] = useState<GHProfile | null>(null);
  const [repos,   setRepos]   = useState<GHRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USER}`).then(r => r.json()),
      fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=12`).then(r => r.json()),
    ])
      .then(([p, r]) => {
        setProfile(p as GHProfile);
        setRepos(Array.isArray(r) ? (r as GHRepo[]) : []);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <div className={styles.root}>
      {/* Browser chrome */}
      <div className={styles.chrome}>
        <div className={styles.navBtns}>
          <button className={styles.navBtn} disabled aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 3L5 8L10 13"/></svg>
          </button>
          <button className={styles.navBtn} disabled aria-label="Forward">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 3L11 8L6 13"/></svg>
          </button>
          <button className={styles.navBtn} onClick={() => window.location.reload()} aria-label="Reload">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.5 2.5A7 7 0 1 0 14 8"/><path d="M14 2.5V6h-3.5"/>
            </svg>
          </button>
        </div>

        <div className={styles.urlBar}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={styles.lockIcon}>
            <rect x="3" y="7" width="10" height="8" rx="1.5"/><path d="M5 7V5a3 3 0 016 0v2"/>
          </svg>
          <span className={styles.urlText}>{GITHUB_URL}</span>
        </div>

        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={styles.newTabBtn} title="Open in new tab">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V9"/><path d="M10 2h4v4"/><path d="M14 2L8 8"/>
          </svg>
        </a>
      </div>

      {/* Page */}
      <div className={styles.page}>
        {loading && (
          <div className={styles.loadWrap}>
            <div className={styles.loadBar}><div className={styles.loadFill}/></div>
            <div className={styles.loadMsg}>Loading github.com…</div>
          </div>
        )}

        {error && !loading && (
          <div className={styles.errWrap}>
            <p className={styles.errTitle}>Failed to load</p>
            <p className={styles.errSub}>Check your connection or open GitHub directly.</p>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={styles.openBtn}>Open GitHub →</a>
          </div>
        )}

        {!loading && !error && profile && (
          <div className={styles.ghPage}>
            {/* Nav */}
            <div className={styles.ghNav}>
              <svg viewBox="0 0 98 96" width="26" height="26" fill="white">
                <path d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0112.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
              </svg>
              <span className={styles.ghNavItem}>Product</span>
              <span className={styles.ghNavItem}>Solutions</span>
              <span className={styles.ghNavItem}>Open Source</span>
              <span className={styles.ghNavItem}>Pricing</span>
            </div>

            {/* Body */}
            <div className={styles.ghBody}>
              {/* Sidebar */}
              <aside className={styles.ghSidebar}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.login} className={styles.ghAvatar} />
                ) : (
                  <div className={styles.ghAvatarFallback}>{(profile.name ?? profile.login)[0]}</div>
                )}
                <h2 className={styles.ghName}>{profile.name || profile.login}</h2>
                <p className={styles.ghLogin}>{profile.login}</p>
                {profile.bio && <p className={styles.ghBio}>{profile.bio}</p>}
                <div className={styles.ghMeta}>
                  {profile.location && <span>📍 {profile.location}</span>}
                  {profile.blog && <span>🔗 {profile.blog.replace(/^https?:\/\//, '')}</span>}
                </div>
                <div className={styles.ghStats}>
                  <span><strong>{profile.followers}</strong> followers</span>
                  <span><strong>{profile.following}</strong> following</span>
                </div>
              </aside>

              {/* Main */}
              <main className={styles.ghMain}>
                <div className={styles.ghTabs}>
                  {['Overview', 'Repositories', 'Projects', 'Stars'].map((t, i) => (
                    <span key={t} className={`${styles.ghTab} ${i === 1 ? styles.ghTabActive : ''}`}>{t}</span>
                  ))}
                  <span className={styles.repoCount}>{profile.public_repos}</span>
                </div>

                <div className={styles.repoGrid}>
                  {repos.filter(r => !r.fork).slice(0, 6).map(repo => (
                    <a
                      key={repo.id}
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.repoCard}
                    >
                      <div className={styles.repoTop}>
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className={styles.repoIcon}>
                          <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
                        </svg>
                        <span className={styles.repoName}>{repo.name}</span>
                        <span className={styles.repoBadge}>Public</span>
                      </div>
                      {repo.description && <p className={styles.repoDesc}>{repo.description}</p>}
                      <div className={styles.repoMeta}>
                        {repo.language && (
                          <span className={styles.repoLang}>
                            <span className={styles.langDot} style={{ background: LANG_COLORS[repo.language] ?? '#ccc' }}/>
                            {repo.language}
                          </span>
                        )}
                        {repo.stargazers_count > 0 && (
                          <span className={styles.repoStars}>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
                            </svg>
                            {repo.stargazers_count}
                          </span>
                        )}
                        <span className={styles.repoUpdated}>Updated {timeAgo(repo.updated_at)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </main>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
