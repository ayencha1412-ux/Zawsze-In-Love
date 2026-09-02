import { formatDate } from '../lib/format.js';

export default function TimelineView({
  timeline,
  type,
  setType,
  favorite,
  setFavorite,
  onAdd,
  onFavorite,
  onEdit,
  onDelete,
  onPhotoOpen,
}) {
  return (
    <section className="section app-section timeline-section">
      <div className="gallery-toolbar">
        <div className="section-head"><span className="section-index">03</span><h2>The timeline</h2><p>The firsts, the trips, the quiet days, and everything between.</p></div>
        <button className="btn primary" onClick={onAdd}>＋ Add a moment</button>
      </div>

      <div className="filter-row compact">
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">Every kind</option>
          <option value="first">First</option>
          <option value="date">Date</option>
          <option value="trip">Trip</option>
          <option value="anniversary">Anniversary</option>
          <option value="achievement">Achievement</option>
          <option value="memory">Memory</option>
        </select>
        <label className="check-chip"><input type="checkbox" checked={favorite} onChange={(event) => setFavorite(event.target.checked)} /> Favorites</label>
      </div>

      <ol className="thread full-thread">
        {timeline.length ? timeline.map((item) => (
          <li className="t-item timeline-card" key={item.id}>
            <span className="thread-dot" />
            <div className="timeline-content">
              <div className="t-date">{formatDate(item.eventDate) || 'Undated'}</div>
              <div className="timeline-title-row">
                <div className="t-title">{item.title}</div>
                <div className="card-actions inline">
                  <button className={item.isFavorite ? 'is-on' : ''} onClick={() => onFavorite(item)}>♥</button>
                  <button onClick={() => onEdit(item)}>Edit</button>
                  <button onClick={() => onDelete(item)}>Delete</button>
                </div>
              </div>
              {item.description && <p className="t-desc">{item.description}</p>}
              <span className="type-chip">{item.eventType}</span>
              {item.isLocked && <span className="type-chip">locked</span>}
              {item.files?.length > 0 && (
                <div className="timeline-photos">
                  {item.files.map((file, index) => (
                    <button type="button" key={file.id} onClick={() => onPhotoOpen(item, index)}>
                      <img src={file.url} alt={item.title} loading="lazy" decoding="async" fetchPriority="low" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </li>
        )) : <li className="empty-state">Your timeline is waiting for its first moment.</li>}
      </ol>
    </section>
  );
}
