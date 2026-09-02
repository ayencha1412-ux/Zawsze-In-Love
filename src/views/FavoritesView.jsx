import MemoryCard from '../components/MemoryCard.jsx';
import { formatDate } from '../lib/format.js';

export default function FavoritesView({ favorites, onOpenMemory }) {
  return (
    <section className="section app-section favorites-section">
      <div className="gallery-toolbar">
        <div className="section-head"><span className="section-index">04</span><h2>Our favorites</h2><p>Your personal collection of the memories, notes, and milestones you never want to lose.</p></div>
      </div>

      <div className="favorites-block">
        <h3>Memories</h3>
        <div className="gallery compact-gallery">
          {favorites.memories?.length ? favorites.memories.map((memory, index) => (
            <MemoryCard key={memory.id} memory={memory} index={index} onOpen={onOpenMemory} compact />
          )) : <p className="empty-state">No favorite memories yet.</p>}
        </div>
      </div>

      <div className="favorites-block">
        <h3>Love notes</h3>
        <div className="notes">
          {favorites.notes?.length ? favorites.notes.map((note) => (
            <article className="note" key={note.id}>
              <div className="note-head"><span className="note-author">{note.authorName}</span><time className="note-time">{formatDate(note.createdAt, true)}</time></div>
              {note.locked ? <div className="sealed-note"><span>🔒</span><strong>Private note</strong></div>
                : note.sealed ? <div className="sealed-note"><span>✉</span><strong>Letter for later</strong><small>Opens {formatDate(note.openAt, true)}</small></div>
                  : <p className="note-body">{note.body}</p>}
            </article>
          )) : <p className="empty-state">No favorite notes yet.</p>}
        </div>
      </div>

      <div className="favorites-block">
        <h3>Timeline moments</h3>
        <ol className="thread full-thread">
          {favorites.timeline?.length ? favorites.timeline.map((item) => (
            <li className="t-item timeline-card" key={item.id}>
              <span className="thread-dot" />
              <div className="timeline-content">
                <div className="t-date">{formatDate(item.eventDate)}</div>
                <div className="t-title">{item.title}</div>
                {item.description && <p className="t-desc">{item.description}</p>}
                <span className="type-chip">{item.eventType}</span>
              </div>
            </li>
          )) : <li className="empty-state">No favorite milestones yet.</li>}
        </ol>
      </div>
    </section>
  );
}
