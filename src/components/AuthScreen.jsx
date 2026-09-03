import { useState } from 'react';
import RomanticBackdrop from './RomanticBackdrop.jsx';
import FloatingHeartLayer from './FloatingHeartLayer.jsx';
import PolaroidFrame from './PolaroidFrame.jsx';
import TetrisHeartLoader from './TetrisHeartLoader.jsx';
import { FEATURED_MEMORIES } from '../data/featuredMemories.js';
import { apiRequest, setStoredToken } from '../lib/api.js';

export default function AuthScreen({ onAuthenticated }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);

    try {
      const result = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email: form.get('email'), password: form.get('password') },
      });
      setStoredToken(result.token);
      await onAuthenticated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen landing-shell">
      <RomanticBackdrop variant="landing" />
      <FloatingHeartLayer variant="landing" />

      <section className="auth-story landing-story">
        <div className="landing-brandline">
          <span className="brand-mark large">♡</span>
          <div>
            <div className="eyebrow">Zawsze In Love</div>
            <span className="landing-private-pill">Private shared archive</span>
          </div>
        </div>

        <h1>Ayen & Jonalyn<br /><em>worth keeping.</em></h1>
        <p className="auth-lede">
          A private memory space for Ayen Chavez and Jonalyn Balmores — photos, videos, love notes,
          milestones, sealed letters, and the story you are still writing.
        </p>

        <div className="landing-promise-row" aria-label="Archive highlights">
          <span><b>♡</b> Made for two</span>
          <span><b>✦</b> Private memories</span>
          <span><b>∞</b> Built to keep growing</span>
        </div>

        <div className="landing-memory-board" aria-hidden="true">
          <div className="memory-board-heading"><span>a few pieces of us</span><small>kept close ♡</small></div>
          <div className="auth-polaroids landing-polaroids">
            {FEATURED_MEMORIES.map((photo, index) => (
              <PolaroidFrame key={photo.caption} photo={photo} index={index} variant="landing" decorative />
            ))}
          </div>
          <span className="memory-board-note">little moments, forever ours</span>
        </div>
      </section>

      <section className="auth-card login-only-card landing-login-card">
        <div className="login-card-accent" aria-hidden="true" />
        <form className="auth-form" onSubmit={submit}>
          <div className="login-card-heading">
            <div className="login-card-status"><span /> Private access</div>
            <div className="eyebrow">Two people only</div>
            <h2>Come back to us.</h2>
            <p className="auth-helper">Sign in with either Ayen's or Jonalyn's private account.</p>
          </div>

          <label><span>Email</span><input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
          <label><span>Password</span><input name="password" type="password" required autoComplete="current-password" placeholder="Your private password" /></label>
          <button className="btn primary wide landing-signin" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to our archive'}</button>
          {busy && <TetrisHeartLoader compact label="Opening your archive…" />}
          {error && <p className="form-error">{error}</p>}

          <div className="privacy-note landing-privacy-note">
            <span className="privacy-icon">♡</span>
            <div><strong>Just your shared space.</strong><small>No public registration, no social feed, and no strangers browsing your story.</small></div>
          </div>
        </form>
      </section>
    </main>
  );
}
