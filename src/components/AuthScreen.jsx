import { useState } from 'react';
import photo1 from '../assets/photo-1.webp';
import photo2 from '../assets/photo-2.webp';
import photo3 from '../assets/photo-3.webp';
import { apiRequest, setStoredToken } from '../lib/api.js';

const FEATURED = [
  { src: photo1, caption: 'that one afternoon' },
  { src: photo2, caption: 'still my favorite' },
  { src: photo3, caption: 'just because' },
];

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
    <main className="auth-screen">
      <section className="auth-story">
        <span className="brand-mark large">♡</span>
        <div className="eyebrow">Zawsze In Love</div>
        <h1>Ayen & Jonalyn<br /><em>worth keeping.</em></h1>
        <p className="auth-lede">
          A private memory space for Ayen Chavez and Jonalyn Balmores — photos, videos, love notes,
          milestones, sealed letters, and the story you are still writing.
        </p>
        <div className="auth-polaroids" aria-hidden="true">
          {FEATURED.map((photo, index) => (
            <figure className={`mini-pol p${index + 1}`} key={photo.caption}>
              <img src={photo.src} alt="" decoding="async" />
            </figure>
          ))}
        </div>
      </section>

      <section className="auth-card login-only-card">
        <form className="auth-form" onSubmit={submit}>
          <div>
            <div className="eyebrow">Two people only</div>
            <h2>Come back to us.</h2>
            <p className="auth-helper">Sign in with either Ayen's or Jonalyn's private account.</p>
          </div>
          <label><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
          <label><span>Password</span><input name="password" type="password" required autoComplete="current-password" /></label>
          <button className="btn primary wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          {error && <p className="form-error">{error}</p>}
          <div className="privacy-note">No public registration. No social feed. Just your shared archive.</div>
        </form>
      </section>
    </main>
  );
}

export { FEATURED };
