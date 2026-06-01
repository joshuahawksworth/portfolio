import { useState } from 'react';
import styles from './ContactApp.module.css';

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function ContactApp() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className={styles.root}>
      {/* Mail-style toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.toolBtn} disabled>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3L5 8l5 5"/></svg>
          </button>
          <button className={styles.toolBtn} disabled>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5"/></svg>
          </button>
        </div>
        <span className={styles.toolbarTitle}>New Message</span>
      </div>

      <form className={styles.form} onSubmit={submit}>
        {/* To */}
        <div className={styles.field}>
          <label className={styles.label}>To</label>
          <span className={styles.fieldValue}>joshuahawksworth@me.com</span>
        </div>
        <div className={styles.divider} />

        {/* From name */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">From</label>
          <input
            id="name"
            className={styles.input}
            placeholder="Your name"
            value={form.name}
            onChange={set('name')}
            required
          />
        </div>
        <div className={styles.divider} />

        {/* Email */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Reply-To</label>
          <input
            id="email"
            type="email"
            className={styles.input}
            placeholder="your@email.com"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>
        <div className={styles.divider} />

        {/* Message */}
        <textarea
          className={styles.textarea}
          placeholder="Write your message here…"
          value={form.message}
          onChange={set('message')}
          required
        />

        {/* Footer */}
        <div className={styles.footer}>
          {status === 'success' && <span className={styles.success}>Message sent!</span>}
          {status === 'error'   && <span className={styles.error}>Failed to send. Try again.</span>}
          <button type="submit" className={styles.sendBtn} disabled={status === 'sending'}>
            {status === 'sending'
              ? <><span className={styles.spinner}/> Sending…</>
              : <>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2L2 6.5l5 2.5 2.5 5L14 2z"/>
                  </svg>
                  Send
                </>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
