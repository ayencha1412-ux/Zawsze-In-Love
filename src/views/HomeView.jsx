import MemoryPreview from '../components/MemoryPreview.jsx';
import PolaroidFrame from '../components/PolaroidFrame.jsx';
import RomanticBackdrop from '../components/RomanticBackdrop.jsx';
import FEATURED_MEMORIES from '../data/featuredMemories.js';
import { formatDate } from '../lib/format.js';

export default function HomeView({ session, partnerNames, dashboard, onThisDayItems, onNavigate }) {
  return (
    <div className="home-dashboard">
      <RomanticBackdrop variant="dashboard" />

      <section className="hero app-hero dashboard-hero">
        <div className="hero-text hero-reveal dashboard-hero-copy">
          <div className="home-welcome-row">
            <span className="home-status"><i /> Our private place</span>
            <span className="home-couple-mark">♡ {session.couple.name}</span>
          </div>

          <div className="eyebrow">Still choosing each other</div>
          <h1>{partnerNames}<br /><em>worth keeping.</em></h1>
          <p className="lede">A quiet place for the photos, words, and moments you never want to lose in a camera roll or old chat.</p>

          <div className="relationship-chips dashboard-chips">
            <div className="relationship-chip"><strong>{dashboard?.relationshipDays ?? '—'}</strong><span>days together</span></div>
            <div className="relationship-chip soft-chip"><strong>{dashboard?.nextAnniversaryDays ?? '—'}</strong><span>days to next anniversary</span></div>
          </div>

          <div className="hero-actions dashboard-hero-actions">
            <button className="btn primary" onClick={() => onNavigate('gallery')}>＋ Add a memory</button>
            <button className="btn soft" onClick={() => onNavigate('notes')}>♡ Write a note</button>
          </div>

          <div className="dashboard-mini-summary" aria-label="Archive summary">
            <span><strong>{dashboard?.stats?.memories ?? 0}</strong> memories saved</span>
            <span><strong>{dashboard?.stats?.favorites ?? 0}</strong> favorites</span>
          </div>
        </div>

        <div className="dashboard-memory-board">
          <div className="memory-board-pin pin-left" aria-hidden="true" />
          <div className="memory-board-pin pin-right" aria-hidden="true" />
          <div className="dashboard-board-heading">
            <span>our little wall</span>
            <small>the moments that feel like home</small>
          </div>
          <div className="hero-stack dashboard-photo-stack">
            <div className="photo-stack-glow" aria-hidden="true" />
            {FEATURED_MEMORIES.map((photo, index) => (
              <PolaroidFrame
                key={photo.caption}
                photo={photo}
                index={index}
                variant="dashboard"
              />
            ))}
          </div>
          <div className="dashboard-board-footer">
            <span>♡ always us</span>
            <small>more memories waiting in the gallery →</small>
          </div>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-v2">
        <div className="paper-panel on-this-day-panel">
          <div className="panel-heading dashboard-panel-heading">
            <div>
              <span className="section-index">today</span>
              <h2>On this day</h2>
              <p>A small window back into your story.</p>
            </div>
            <span className="dashboard-date-pill">{new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date())}</span>
          </div>

          <div className="archive-list dashboard-archive-list">
            {onThisDayItems.length ? onThisDayItems.map((item) => (
              <article className="archive-card dashboard-archive-card" key={`${item.kind}-${item.id}`}>
                <div className="archive-card-media">
                  {item.files?.[0]
                    ? <MemoryPreview file={item.files[0]} alt="" />
                    : <div className="archive-placeholder">♡</div>}
                </div>
                <div className="archive-card-copy">
                  <small className="archive-kind">{item.kind === 'timeline' ? 'Milestone' : 'Memory'}</small>
                  <strong>{item.title}</strong>
                  <small>{formatDate(item.date)}</small>
                  {item.description && <p>{item.description}</p>}
                </div>
              </article>
            )) : (
              <div className="dashboard-empty-state">
                <span>♡</span>
                <div><strong>Nothing from this date yet.</strong><p>Someday, something you save today may appear here.</p></div>
              </div>
            )}
          </div>
        </div>

        <aside className="dashboard-side-stack">
          <div className="paper-panel stats-card dashboard-stat-card">
            <div className="dashboard-card-icon">♡</div>
            <span className="section-index">your archive</span>
            <h2>Little things add up.</h2>
            <p className="dashboard-card-copyline">Every photo, note, and milestone becomes part of the same story.</p>
            <div className="stat-grid dashboard-stat-grid">
              <div><strong>{dashboard?.stats?.memories ?? 0}</strong><span>memories</span></div>
              <div><strong>{dashboard?.stats?.notes ?? 0}</strong><span>notes</span></div>
              <div><strong>{dashboard?.stats?.timeline ?? 0}</strong><span>moments</span></div>
              <div><strong>{dashboard?.stats?.favorites ?? 0}</strong><span>favorites</span></div>
            </div>
          </div>

          <div className="paper-panel dashboard-quick-card">
            <span className="section-index">keep writing it</span>
            <h3>What do you want to save today?</h3>
            <div className="dashboard-quick-links">
              <button type="button" onClick={() => onNavigate('gallery')}><span>▧</span><div><strong>Memory</strong><small>Photo or video</small></div><b>→</b></button>
              <button type="button" onClick={() => onNavigate('notes')}><span>♡</span><div><strong>Love note</strong><small>A few words for later</small></div><b>→</b></button>
              <button type="button" onClick={() => onNavigate('timeline')}><span>✦</span><div><strong>Milestone</strong><small>Add to your timeline</small></div><b>→</b></button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
