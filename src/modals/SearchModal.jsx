import Modal from '../components/Modal.jsx';
import { formatDate } from '../lib/format.js';

export default function SearchModal({ query, setQuery, results, onClose, navigate }) {
  const groups = [
    {
      title: 'Gallery',
      view: 'gallery',
      items: results.memories || [],
      label: (item) => item.caption || 'Memory',
      detail: (item) => `${formatDate(item.memory_date)} ${item.description || item.location || ''}`,
    },
    {
      title: 'Love notes',
      view: 'notes',
      items: results.notes || [],
      label: (item) => item.author_name || 'Note',
      detail: (item) => item.sealed ? 'Sealed until later' : (item.body || '').slice(0, 100),
    },
    {
      title: 'Timeline',
      view: 'timeline',
      items: results.timeline || [],
      label: (item) => item.title,
      detail: (item) => formatDate(item.event_date),
    },
  ];

  const hasResults = groups.some((group) => group.items.length);

  return (
    <Modal title="Find a memory" kicker="search everything" onClose={onClose} wide>
      <input className="big-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try a place, phrase, or moment…" />
      <div className="search-results">
        {query.trim().length < 2 ? <p className="empty-state">Type at least two characters.</p>
          : hasResults ? groups.map((group) => group.items.length ? (
            <section className="result-group" key={group.title}>
              <h4>{group.title}</h4>
              {group.items.map((item) => (
                <button className="result-row" key={item.id} type="button" onClick={() => navigate(group.view)}>
                  <strong>{group.label(item)}</strong><span>{group.detail(item)}</span>
                </button>
              ))}
            </section>
          ) : null) : <p className="empty-state">No matches found.</p>}
      </div>
    </Modal>
  );
}
