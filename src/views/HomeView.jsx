import { FEATURED } from '../components/AuthScreen.jsx';
import { formatDate } from '../lib/format.js';

export default function HomeView({ session, partnerNames, dashboard, onThisDayItems, onNavigate }) {
  return (
    <>
      <section className="hero app-hero">
        <div className="hero-text hero-reveal">
          <div className="eyebrow">{session.couple.name}</div>
          <h1>{partnerNames}<br /><em>worth keeping.</em></h1>
          <p className="lede">A quiet place for the photos, words, and moments you never want to lose in a camera roll or old chat.</p>
          <div className="relationship-chips">
            <div className="relationship-chip"><strong>{dashboard?.relationshipDays ?? '—'}</strong><span>days together</span></div>
            <div className="relationship-chip soft-chip"><strong>{dashboard?.nextAnniversaryDays ?? '—'}</strong><span>days to next anniversary</span></div>
          </div>
          <div className="hero-actions">
            <button className="btn primary" onClick={() => onNavigate('gallery')}>Add a memory</button>
            <button className="btn soft" onClick={() => onNavigate('notes')}>Write a note</button>
          </div>
        </div>

        <div className="hero-stack">
          {FEATURED.map((photo, index) => (
            <figure className={`hero-polaroid p${index + 1}`} key={photo.caption}>
              <img src={photo.src} alt={photo.caption} decoding="async" />
              <span className="tag">{photo.caption}</span>
            </figure>
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="paper-panel">
          <div className="panel-heading">
            <div><span className="section-index">today</span><h2>On this day</h2></div>
            <span>{new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date())}</span>
          </div>
          <div className="archive-list">
            {onThisDayItems.length ? onThisDayItems.map((item) => (
              <article className="archive-card" key={`${item.kind}-${item.id}`}>
                {item.files?.[0] ? (
                  item.mediaType === 'video'
                    ? <video src={item.files[0].url} muted playsInline preload="metadata" />
                    : <img src={item.files[0].url} alt="" loading="lazy" decoding="async" />
                ) : <div className="archive-placeholder">♡</div>}
                <div>
                  <strong>{item.title}</strong>
                  <small>{formatDate(item.date)}</small>
                  {item.description && <p>{item.description}</p>}
                </div>
              </article>
            )) : <p className="empty-state">No memories from this date yet.</p>}
          </div>
        </div>

        <aside className="paper-panel stats-card">
          <span className="section-index">your archive</span>
          <h2>Little things add up.</h2>
          <div className="stat-grid">
            <div><strong>{dashboard?.stats.memories ?? 0}</strong><span>memories</span></div>
            <div><strong>{dashboard?.stats.notes ?? 0}</strong><span>notes</span></div>
            <div><strong>{dashboard?.stats.timeline ?? 0}</strong><span>moments</span></div>
            <div><strong>{dashboard?.stats.favorites ?? 0}</strong><span>favorites</span></div>
          </div>
        </aside>
      </section>
    </>
  );
}
