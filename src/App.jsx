import { useEffect, useMemo, useRef, useState } from 'react';
import photo1 from './assets/photo-1.webp';
import photo2 from './assets/photo-2.webp';
import photo3 from './assets/photo-3.webp';

const MEMBERS = ['You', 'Love'];
const COMMENT_STORAGE_KEY = 'zawsze-comments-v2';

const seedMemories = [
  {
    id: 'seed-1',
    type: 'image',
    src: photo1,
    title: 'that one afternoon',
    date: '2026-08-12',
    note: 'One of those ordinary days that somehow became a favorite.',
    alt: 'A memory worth keeping',
  },
  {
    id: 'seed-2',
    type: 'image',
    src: photo2,
    title: 'still my favorite',
    date: '2026-06-21',
    note: 'Saved here because camera rolls are too easy to lose things in.',
    alt: 'A favorite saved memory',
  },
  {
    id: 'seed-3',
    type: 'image',
    src: photo3,
    title: 'just because',
    date: '2026-03-09',
    note: 'No big occasion. Just us, and that was enough.',
    alt: 'A simple memory worth saving',
  },
];

const seedComments = {
  'seed-1': [
    {
      id: 'comment-1',
      author: 'Love',
      body: 'keep this one forever please ♡',
      createdAt: '2026-08-13T10:30:00.000Z',
    },
  ],
  'seed-2': [
    {
      id: 'comment-2',
      author: 'You',
      body: 'This is exactly why I wanted our own little archive.',
      createdAt: '2026-08-14T08:15:00.000Z',
    },
  ],
};

function readStoredComments() {
  try {
    const stored = localStorage.getItem(COMMENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : seedComments;
  } catch {
    return seedComments;
  }
}

function dateValue(value) {
  const time = new Date(`${value}T12:00:00`).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function displayDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return 'No date yet';
  return new Intl.DateTimeFormat('en-US', options).format(new Date(`${value}T12:00:00`));
}

function dateFromFile(file) {
  if (!file?.lastModified) return '';
  const date = new Date(file.lastModified);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function titleFromFile(file) {
  return file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'untitled memory';
}

function commentTime(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function App() {
  const [activeSection, setActiveSection] = useState('memories');
  const [memories, setMemories] = useState(seedMemories);
  const [comments, setComments] = useState(readStoredComments);
  const [mediaFilter, setMediaFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [commentAuthor, setCommentAuthor] = useState('You');
  const [commentDraft, setCommentDraft] = useState('');
  const uploadInput = useRef(null);
  const sessionUrls = useRef([]);

  useEffect(() => {
    localStorage.setItem(COMMENT_STORAGE_KEY, JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    const sections = ['memories', 'timeline']
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.1, 0.35] });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setUploadOpen(false);
        setSelectedMemory(null);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => () => {
    sessionUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const sortedMemories = useMemo(() => {
    const filtered = mediaFilter === 'all'
      ? memories
      : memories.filter((memory) => memory.type === mediaFilter);

    return [...filtered].sort((a, b) => {
      const difference = dateValue(b.date) - dateValue(a.date);
      return sortOrder === 'newest' ? difference : -difference;
    });
  }, [memories, mediaFilter, sortOrder]);

  const timelineGroups = useMemo(() => {
    const chronological = [...memories].sort((a, b) => dateValue(b.date) - dateValue(a.date));
    return chronological.reduce((groups, memory) => {
      const label = displayDate(memory.date, { month: 'long', year: 'numeric' });
      if (!groups[label]) groups[label] = [];
      groups[label].push(memory);
      return groups;
    }, {});
  }, [memories]);

  const stats = useMemo(() => {
    const photos = memories.filter((memory) => memory.type === 'image').length;
    const videos = memories.filter((memory) => memory.type === 'video').length;
    const totalComments = Object.values(comments).reduce((sum, list) => sum + list.length, 0);
    return { photos, videos, totalComments, total: memories.length };
  }, [memories, comments]);

  const selectedComments = selectedMemory ? comments[selectedMemory.id] || [] : [];

  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openMemory = (memory) => {
    setSelectedMemory(memory);
    setCommentDraft('');
  };

  const handleFileSelection = (event) => {
    setUploadFiles(Array.from(event.target.files || []));
  };

  const closeUpload = () => {
    setUploadOpen(false);
    setUploadFiles([]);
  };

  const addMemories = (event) => {
    event.preventDefault();
    if (!uploadFiles.length) return;

    const form = event.currentTarget;
    const sharedTitle = form.elements.caption.value.trim();
    const sharedDate = form.elements.memoryDate.value;
    const useFileDates = form.elements.useFileDates.checked;

    const additions = uploadFiles.map((file, index) => {
      const src = URL.createObjectURL(file);
      sessionUrls.current.push(src);
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      const date = useFileDates ? dateFromFile(file) || sharedDate : sharedDate;
      const baseTitle = sharedTitle || titleFromFile(file);

      return {
        id: `session-${Date.now()}-${index}`,
        type,
        src,
        title: uploadFiles.length > 1 && sharedTitle ? `${baseTitle} · ${index + 1}` : baseTitle,
        date: date || new Date().toISOString().slice(0, 10),
        note: '',
        alt: type === 'image' ? baseTitle : '',
        source: 'session',
      };
    });

    setMemories((current) => [...additions, ...current]);
    form.reset();
    closeUpload();
  };

  const addComment = (event) => {
    event.preventDefault();
    const body = commentDraft.trim();
    if (!selectedMemory || !body) return;

    const comment = {
      id: `comment-${Date.now()}`,
      author: commentAuthor,
      body,
      createdAt: new Date().toISOString(),
    };

    setComments((current) => ({
      ...current,
      [selectedMemory.id]: [...(current[selectedMemory.id] || []), comment],
    }));
    setCommentDraft('');
  };

  return (
    <div className="site-shell">
      <header className="navbar">
        <button className="brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="brand-mark">♡</span>
          <span className="brand-copy"><strong>Zawsze</strong><small>in Love</small></span>
        </button>

        <nav className="pill-group" aria-label="Zawsze sections">
          <button className={`pill ${activeSection === 'memories' ? 'is-active' : ''}`} type="button" onClick={() => goTo('memories')}>Memories</button>
          <button className={`pill ${activeSection === 'timeline' ? 'is-active' : ''}`} type="button" onClick={() => goTo('timeline')}>Timeline</button>
        </nav>

        <div className="couple-lock" title="Designed for two private accounts">
          <span className="avatar-chip">Y</span>
          <span className="avatar-chip love">L</span>
          <span>2 people only</span>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">a private memory space for the two of us</div>
            <h1 id="hero-title">Two people.<br /><em>One memory lane.</em></h1>
            <p className="lede">Photos, videos, little comments, and the dates that matter — kept together instead of disappearing into two different camera rolls.</p>

            <div className="hero-actions">
              <button className="btn primary" type="button" onClick={() => setUploadOpen(true)}>＋ Add memories</button>
              <button className="btn ghost" type="button" onClick={() => goTo('memories')}>Browse everything ↓</button>
            </div>

            <div className="hero-stats" aria-label="Memory statistics">
              <div><strong>{stats.total}</strong><span>memories</span></div>
              <div><strong>{stats.photos}</strong><span>photos</span></div>
              <div><strong>{stats.videos}</strong><span>videos</span></div>
              <div><strong>{stats.totalComments}</strong><span>comments</span></div>
            </div>
          </div>

          <div className="hero-visual" aria-label="Featured memories">
            <div className="hero-paper-note">sorted by when it happened,<br />not when it was uploaded ♡</div>
            {seedMemories.map((memory, index) => (
              <button className={`hero-polaroid hero-p${index + 1}`} key={memory.id} type="button" onClick={() => openMemory(memory)}>
                <img src={memory.src} alt={memory.alt} />
                <span className="polaroid-date">{displayDate(memory.date, { month: 'short', day: 'numeric' })}</span>
                <span className="polaroid-title">{memory.title}</span>
              </button>
            ))}
            <span className="hero-doodle heart" aria-hidden="true">♡</span>
            <span className="hero-doodle star" aria-hidden="true">✦</span>
          </div>
        </section>

        <section className="section" id="memories">
          <div className="section-heading-row">
            <div className="section-head">
              <span className="section-index">01 / our archive</span>
              <h2>Everything worth keeping.</h2>
              <p>Upload one memory or a whole batch. Photos and videos live in the same archive and can be sorted by their memory date.</p>
            </div>
            <button className="btn primary" type="button" onClick={() => setUploadOpen(true)}>＋ Upload photos & videos</button>
          </div>

          <div className="memory-toolbar">
            <div className="filter-pills" aria-label="Filter media">
              {[
                ['all', 'All'],
                ['image', 'Photos'],
                ['video', 'Videos'],
              ].map(([value, label]) => (
                <button className={`filter-pill ${mediaFilter === value ? 'active' : ''}`} key={value} type="button" onClick={() => setMediaFilter(value)}>{label}</button>
              ))}
            </div>

            <label className="sort-control">
              <span>Sort by date</span>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>

          <div className="memory-grid" aria-live="polite">
            {sortedMemories.map((memory, index) => {
              const count = comments[memory.id]?.length || 0;
              return (
                <article className="memory-card" key={memory.id} style={{ '--tilt': `${[-1.2, 0.7, -0.4, 1.1][index % 4]}deg` }}>
                  <button className="memory-media" type="button" onClick={() => openMemory(memory)} aria-label={`Open ${memory.title}`}>
                    {memory.type === 'video' ? (
                      <>
                        <video src={memory.src} muted preload="metadata" playsInline />
                        <span className="video-badge">▶ video</span>
                      </>
                    ) : (
                      <img src={memory.src} alt={memory.alt || memory.title} />
                    )}
                  </button>
                  <div className="memory-meta">
                    <div>
                      <time>{displayDate(memory.date)}</time>
                      <h3>{memory.title}</h3>
                    </div>
                    <button className="comment-count" type="button" onClick={() => openMemory(memory)} aria-label={`${count} comments on ${memory.title}`}>♡ {count}</button>
                  </div>
                  {memory.note && <p>{memory.note}</p>}
                  {memory.source === 'session' && <span className="session-badge">session preview</span>}
                </article>
              );
            })}
          </div>

          {!sortedMemories.length && (
            <div className="empty-state">
              <span>♡</span>
              <h3>No memories in this filter yet.</h3>
              <button className="btn soft" type="button" onClick={() => setUploadOpen(true)}>Add the first one</button>
            </div>
          )}
        </section>

        <section className="section timeline-section" id="timeline">
          <div className="section-heading-row timeline-title-row">
            <div className="section-head">
              <span className="section-index">02 / by date</span>
              <h2>Our timeline.</h2>
              <p>The same archive, grouped by month so it reads more like a story than a folder.</p>
            </div>
            <div className="timeline-note">new uploads can use each file's date automatically</div>
          </div>

          <div className="timeline-list">
            {Object.entries(timelineGroups).map(([month, items]) => (
              <div className="timeline-group" key={month}>
                <div className="timeline-month"><span>{month}</span></div>
                <div className="timeline-items">
                  {items.map((memory) => (
                    <button className="timeline-memory" key={memory.id} type="button" onClick={() => openMemory(memory)}>
                      <div className="timeline-thumb">
                        {memory.type === 'video' ? <video src={memory.src} muted preload="metadata" playsInline /> : <img src={memory.src} alt="" />}
                        {memory.type === 'video' && <span>▶</span>}
                      </div>
                      <div>
                        <time>{displayDate(memory.date, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                        <strong>{memory.title}</strong>
                        <small>{comments[memory.id]?.length || 0} comments</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <span className="footer-heart">♡</span>
        <p>Zawsze in Love — our photos, our videos, our little comments.</p>
        <small>React frontend · Laravel API connection prepared</small>
      </footer>

      {uploadOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeUpload()}>
          <section className="modal upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
            <button className="modal-close" type="button" onClick={closeUpload} aria-label="Close upload">×</button>
            <div className="modal-kicker">add to our archive</div>
            <h2 id="upload-title">Upload memories</h2>
            <p className="modal-intro">Choose one file or a whole batch. Images and videos can be selected together.</p>

            <form className="modal-form" onSubmit={addMemories}>
              <button className="upload-drop" type="button" onClick={() => uploadInput.current?.click()}>
                <input ref={uploadInput} type="file" accept="image/*,video/*" multiple onChange={handleFileSelection} />
                <span className="upload-icon">＋</span>
                <strong>{uploadFiles.length ? `${uploadFiles.length} file${uploadFiles.length === 1 ? '' : 's'} selected` : 'Choose photos & videos'}</strong>
                <small>Bulk selection is supported · images + video</small>
              </button>

              {uploadFiles.length > 0 && (
                <div className="selected-files">
                  {uploadFiles.slice(0, 4).map((file) => <span key={`${file.name}-${file.lastModified}`}>{file.name}</span>)}
                  {uploadFiles.length > 4 && <span>+ {uploadFiles.length - 4} more</span>}
                </div>
              )}

              <label className="field">
                <span>Shared caption <em>optional</em></span>
                <input name="caption" maxLength="80" placeholder="Weekend in... / our little date / just because" />
              </label>

              <label className="field">
                <span>Fallback memory date</span>
                <input name="memoryDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              </label>

              <label className="checkbox-field">
                <input name="useFileDates" type="checkbox" defaultChecked />
                <span><strong>Use each file's original date when available</strong><small>Better for mass uploads because memories stay in their real order.</small></span>
              </label>

              <div className="prototype-note">
                <strong>Frontend preview behavior</strong>
                <span>New media stays for this browser session only. The Laravel backend will make uploads permanent and shared between both accounts.</span>
              </div>

              <div className="modal-actions">
                <button className="btn ghost" type="button" onClick={closeUpload}>Cancel</button>
                <button className="btn primary" type="submit" disabled={!uploadFiles.length}>Add {uploadFiles.length || ''} {uploadFiles.length === 1 ? 'memory' : 'memories'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedMemory && (
        <div className="memory-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedMemory(null)}>
          <section className="memory-dialog" role="dialog" aria-modal="true" aria-labelledby="memory-title">
            <button className="dialog-close" type="button" onClick={() => setSelectedMemory(null)} aria-label="Close memory">×</button>

            <div className="dialog-media">
              {selectedMemory.type === 'video' ? (
                <video src={selectedMemory.src} controls playsInline preload="metadata" />
              ) : (
                <img src={selectedMemory.src} alt={selectedMemory.alt || selectedMemory.title} />
              )}
            </div>

            <aside className="dialog-panel">
              <div className="dialog-heading">
                <time>{displayDate(selectedMemory.date)}</time>
                <h2 id="memory-title">{selectedMemory.title}</h2>
                {selectedMemory.note && <p>{selectedMemory.note}</p>}
              </div>

              <div className="comment-section">
                <div className="comment-heading"><strong>Our comments</strong><span>{selectedComments.length}</span></div>
                <div className="comment-list">
                  {selectedComments.length ? selectedComments.map((comment) => (
                    <article className={`comment ${comment.author === 'Love' ? 'from-love' : ''}`} key={comment.id}>
                      <div><strong>{comment.author}</strong><time>{commentTime(comment.createdAt)}</time></div>
                      <p>{comment.body}</p>
                    </article>
                  )) : <p className="no-comments">No comments yet. Leave the first little note.</p>}
                </div>

                <form className="comment-form" onSubmit={addComment}>
                  <div className="member-toggle" aria-label="Comment as">
                    {MEMBERS.map((member) => (
                      <button className={commentAuthor === member ? 'active' : ''} type="button" key={member} onClick={() => setCommentAuthor(member)}>{member}</button>
                    ))}
                  </div>
                  <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength="500" placeholder="Say something about this memory..." />
                  <button className="btn primary" type="submit" disabled={!commentDraft.trim()}>Comment ♡</button>
                </form>
              </div>
            </aside>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
