import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import styles from './ContactApp.module.css';

type ActionState = { status: 'idle' | 'success' | 'error' };

async function contactAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
      }),
    });
    if (!res.ok) throw new Error();
    return { status: 'success' };
  } catch {
    return { status: 'error' };
  }
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.sendBtn} disabled={pending}>
      {pending
        ? <><span className={styles.spinner} /> Sending…</>
        : <>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2L2 6.5l5 2.5 2.5 5L14 2z"/>
            </svg>
            Send
          </>
      }
    </button>
  );
}

export default function ContactApp() {
  const [state, action] = useActionState<ActionState, FormData>(contactAction, { status: 'idle' });

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

      <form className={styles.form} action={action}>
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
            name="name"
            className={styles.input}
            placeholder="Your name"
            required
          />
        </div>
        <div className={styles.divider} />

        {/* Email */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Reply-To</label>
          <input
            id="email"
            name="email"
            type="email"
            className={styles.input}
            placeholder="your@email.com"
            required
          />
        </div>
        <div className={styles.divider} />

        {/* Message */}
        <textarea
          name="message"
          className={styles.textarea}
          placeholder="Write your message here…"
          required
        />

        {/* Footer */}
        <div className={styles.footer}>
          {state.status === 'success' && <span className={styles.success}>Message sent!</span>}
          {state.status === 'error'   && <span className={styles.error}>Failed to send. Try again.</span>}
          <SendButton />
        </div>
      </form>
    </div>
  );
}
