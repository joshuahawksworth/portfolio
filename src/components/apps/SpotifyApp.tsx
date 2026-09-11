/**
 * Spotify, purely decorative: the library, a few playlists and a now-playing bar. Nothing
 * streams — pressing play says so and points at the real app.
 */
import { useState } from 'react';
import styles from './SpotifyApp.module.css';

const PLAYLISTS = [
  { id: 'focus', name: 'Deep Focus', by: 'Spotify', hue: 200, tracks: 214 },
  { id: 'lofi', name: 'lofi beats', by: 'Spotify', hue: 300, tracks: 640 },
  { id: 'josh', name: "Josh's Dev Mix", by: 'joshuahawksworth', hue: 45, tracks: 88 },
  { id: 'synth', name: 'Synthwave Coding', by: 'joshuahawksworth', hue: 330, tracks: 52 },
  { id: 'ambient', name: 'Ambient Rain', by: 'Spotify', hue: 160, tracks: 120 },
  { id: 'jazz', name: 'Late Night Jazz', by: 'Spotify', hue: 20, tracks: 173 },
];

const TRACKS = [
  ['Midnight Deploy', 'Cascade Sync', '3:42'],
  ['Hot Reload', 'Metro Bundler', '4:05'],
  ['Strict Mode', 'The Linters', '2:58'],
  ['Async Sunset', 'Promise & Co.', '5:11'],
  ['Green Pipeline', 'CI Runners', '3:27'],
  ['Merge Conflict (Resolved)', 'Git Blame', '4:44'],
  ['Offline First', 'Query Client', '3:15'],
  ['Ship It', 'Release Train', '2:49'],
];

export default function SpotifyApp() {
  const [selected, setSelected] = useState(PLAYLISTS[2]);
  const [toast, setToast] = useState<string | null>(null);

  function play() {
    setToast(
      'Playback isn’t available in this browser copy of Spotify. Open the real Spotify app to listen.'
    );
    window.setTimeout(() => setToast(null), 3200);
  }

  return (
    <div className={styles.root}>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.nav}>
            <button type="button" className={`${styles.navBtn} ${styles.navActive}`}>
              ⌂ Home
            </button>
            <button type="button" className={styles.navBtn}>
              ⌕ Search
            </button>
          </div>
          <div className={styles.libHead}>Your Library</div>
          {PLAYLISTS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.libItem} ${selected.id === p.id ? styles.libActive : ''}`}
              onClick={() => setSelected(p)}
            >
              <span
                className={styles.cover}
                style={{
                  background: `linear-gradient(135deg, hsl(${p.hue} 70% 55%), hsl(${p.hue + 40} 60% 30%))`,
                }}
              />
              <span className={styles.libText}>
                <span className={styles.libName}>{p.name}</span>
                <span className={styles.libBy}>Playlist · {p.by}</span>
              </span>
            </button>
          ))}
        </aside>

        <main className={styles.main}>
          <div
            className={styles.hero}
            style={{
              background: `linear-gradient(180deg, hsl(${selected.hue} 55% 35%), #121212 80%)`,
            }}
          >
            <span
              className={`${styles.cover} ${styles.heroCover}`}
              style={{
                background: `linear-gradient(135deg, hsl(${selected.hue} 70% 55%), hsl(${selected.hue + 40} 60% 30%))`,
              }}
            />
            <div>
              <div className={styles.kicker}>Playlist</div>
              <h1 className={styles.title}>{selected.name}</h1>
              <div className={styles.meta}>
                <strong>{selected.by}</strong> · {selected.tracks} songs, about{' '}
                {Math.round((selected.tracks * 3.6) / 60)} hr
              </div>
            </div>
          </div>
          <div className={styles.controls}>
            <button type="button" className={styles.playBig} onClick={play} aria-label="Play">
              ▶
            </button>
            <button type="button" className={styles.ghost} onClick={play}>
              Shuffle
            </button>
          </div>
          <table className={styles.tracks}>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Album</th>
                <th>⏱</th>
              </tr>
            </thead>
            <tbody>
              {TRACKS.map(([t, a, d], i) => (
                <tr key={t} onDoubleClick={play}>
                  <td>{i + 1}</td>
                  <td>
                    <span className={styles.trackName}>{t}</span>
                    <span className={styles.trackArtist}>{a}</span>
                  </td>
                  <td className={styles.trackAlbum}>{selected.name}</td>
                  <td>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </div>

      <div className={styles.nowPlaying}>
        <div className={styles.npLeft}>
          <span
            className={styles.cover}
            style={{ background: 'linear-gradient(135deg, hsl(45 70% 55%), hsl(85 60% 30%))' }}
          />
          <span className={styles.libText}>
            <span className={styles.libName}>Midnight Deploy</span>
            <span className={styles.libBy}>Cascade Sync</span>
          </span>
        </div>
        <div className={styles.npCenter}>
          <div className={styles.npButtons}>
            <button type="button" onClick={play} aria-label="Previous">
              ⏮
            </button>
            <button type="button" className={styles.npPlay} onClick={play} aria-label="Play">
              ▶
            </button>
            <button type="button" onClick={play} aria-label="Next">
              ⏭
            </button>
          </div>
          <div className={styles.progress}>
            <span>0:00</span>
            <span className={styles.bar}>
              <span className={styles.barFill} />
            </span>
            <span>3:42</span>
          </div>
        </div>
        <div className={styles.npRight}>
          <span>🔈</span>
          <span className={styles.bar} style={{ width: 80 }}>
            <span className={styles.barFill} style={{ width: '70%' }} />
          </span>
        </div>
      </div>
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
