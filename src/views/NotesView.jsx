import { formatDate } from '../lib/format.js';

export default function NotesView({ notes, currentUserId, onAdd, onHeart, onFavorite, onEdit, onDelete }) {
  return (
    <section className="section app-section notes-section">
      <div className="gallery-toolbar">
        <div className="section-head"><span className="section-index">02</span><h2>Love notes</h2><p>Words worth saving — including letters for later.</p></div>
        <button className="btn primary" onClick={onAdd}>＋ Write a note</button>
      </div>

      <div className="notes">
        {notes.length ? notes.map((note) => (
          <article className="note" key={note.id}>
            <div className="note-head">
              <span className="note-author">{note.authorName}{note.isPinned && ' · pinned'}{note.isLocked && ' · locked'}</span>
              <time className="note-time">{formatDate(note.createdAt, true)}</time>
            </div>
            {note.locked ? (
              <div className="sealed-note"><span>🔒</span><strong>Private note</strong><small>Unlock it from Settings.</small></div>
            ) : note.sealed ? (
              <div className="sealed-note"><span>✉</span><strong>A letter for later</strong><small>Opens {formatDate(note.openAt, true)}</small></div>
            ) : <p className="note-body">{note.body}</p>}

            <div className="note-actions">
              <button className={note.heartedByMe ? 'is-on' : ''} onClick={() => onHeart(note)}>♥ {note.heartCount}</button>
              <button className={note.isFavorite ? 'is-on' : ''} onClick={() => onFavorite(note)}>★ Favorite</button>
              {note.authorId === currentUserId && (
                <>
                  <button onClick={() => onEdit(note)}>Edit</button>
                  <button onClick={() => onDelete(note)}>Delete</button>
                </>
              )}
            </div>
          </article>
        )) : <p className="empty-state">No love notes yet.</p>}
      </div>
    </section>
  );
}
