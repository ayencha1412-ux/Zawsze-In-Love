import { useEffect, useMemo, useRef, useState } from 'react';
import march10Sprite from './assets/march-10/march10-sprite.webp';
import './sprite.css';

const MEMBERS = ['You', 'Love'];
const COMMENT_STORAGE_KEY = 'zawsze-comments-v3';

const march10Memories = [
  {
    id: 'march10-0448',
    type: 'image',
    spriteIndex: 0,
    title: 'flash & a little attitude',
    date: '2026-03-10',
    note: 'The flash showed up loud, but the pose still won ♡',
    alt: 'Mirror photo with a bright camera flash and a soft smile.',
  },
  {
    id: 'march10-0453',
    type: 'image',
    spriteIndex: 1,
    title: 'tiny pose, big charm',
    date: '2026-03-10',
    note: 'Just a little hand pose and somehow the whole frame got sweeter.',
    alt: 'Mirror photo with a camera flash and one hand near the collar.',
  },
  {
    id: 'march10-0454',
    type: 'image',
    spriteIndex: 2,
    title: 'soft look, camera ready',
    date: '2026-03-10',
    note: 'A calm little mirror moment that deserved its own save button ♡',
    alt: 'Mirror photo with a bright flash and a composed expression.',
  },
  {
    id: 'march10-0466',
    type: 'image',
    spriteIndex: 3,
    title: 'main character break',
    date: '2026-03-10',
    note: 'No flash needed — the look already knew what it was doing.',
    alt: 'Close mirror photo holding a compact camera with arms lightly crossed.',
  },
  {
    id: 'march10-0470',
    type: 'image',
    spriteIndex: 4,
    title: 'the little pout one',
    date: '2026-03-10',
    note: 'A tiny pout for the archive because cute moods count too.',
    alt: 'Mirror photo with a playful pout while holding a compact camera.',
  },
  {
    id: 'march10-0474',
    type: 'image',
    spriteIndex: 5,
    title: 'kissy face intermission',
    date: '2026-03-10',
    note: 'A quick kissy face because serious photos were clearly not enough ♡',
    alt: 'Mirror photo with a playful kissy-face expression.',
  },
  {
    id: 'march10-0475',
    type: 'image',
    spriteIndex: 6,
    title: 'cute but unimpressed',
    date: '2026-03-10',
    note: 'The expression says “hmm,” but the photo says “keep me.”',
    alt: 'Mirror photo with a mock-serious expression and one hand on the counter.',
  },
  {
    id: 'march10-0481',
    type: 'image',
    spriteIndex: 7,
    title: 'caught smiling again',
    date: '2026-03-10',
    note: 'That little smile turned the whole mirror shot warm.',
    alt: 'Mirror photo smiling while one hand rests near the hair.',
  },
  {
    id: 'march10-0484',
    type: 'image',
    spriteIndex: 8,
    title: 'soft pout, softer moment',
    date: '2026-03-10',
    note: 'A tiny head tilt, a tiny pout, and one more reason to keep this set.',
    alt: 'Mirror photo with a slight pout and tilted head.',
  },
  {
    id: 'march10-0487',
    type: 'image',
    spriteIndex: 9,
    title: 'quiet little stare',
    date: '2026-03-10',
    note: 'The calm expression made this one feel like a pause in the whole photo spree.',
    alt: 'Mirror photo with a calm neutral expression.',
  },
  {
    id: 'march10-0489',
    type: 'image',
    spriteIndex: 10,
    title: 'smile unlocked',
    date: '2026-03-10',
    note: 'The smile finally won, and obviously this one had to stay ♡',
    alt: 'Mirror photo with a bright happy smile.',
  },
  {
    id: 'march10-0406',
    type: 'image',
    spriteIndex: 11,
    title: 'the whole mirror moment',
    date: '2026-03-10',
    note: 'A wider little snapshot where the plants, the mirror, and the pose all joined in.',
    alt: 'Wide mirror photo showing the full setting with plants and sinks.',
  },
  {
    id: 'march10-0436',
    type: 'image',
    spriteIndex: 12,
    title: 'vintage mirror mood',
    date: '2026-03-10',
    note: 'That warm old-film look made this mirror moment extra cozy.',
    alt: 'Warm-toned mirror photo smiling beside a compact camera.',
  },
  {
    id: 'march10-0437',
    type: 'image',
    spriteIndex: 13,
    title: 'one silly second',
    date: '2026-03-10',
    note: 'A tiny tongue-out moment to keep the serious poses from getting too powerful ♡',
    alt: 'Warm-toned playful mirror photo with a tongue-out expression.',
  },
  {
    id: 'march10-0451',
    type: 'image',
    spriteIndex: 14,
    title: 'flash, hair touch, done',
    date: '2026-03-10',
    note: 'The flash plus the little hair touch made this one effortlessly cute.',
    alt: 'Mirror photo with bright camera flash and one hand touching the hair.',
  },
  {
    id: 'march10-0456',
    type: 'image',
    spriteIndex: 15,
    title: 'that easy little smile',
    date: '2026-03-10',
    note: 'A smile this natural deserved a permanent spot in the memory lane.',
    alt: 'Mirror photo smiling while holding a compact camera.',
  },
  {
    id: 'march10-0460',
    type: 'image',
    spriteIndex: 16,
    title: 'straight to the camera',
    date: '2026-03-10',
    note: 'Simple, composed, and somehow still one of the sweetest frames.',
    alt: 'Mirror photo facing the camera directly with a composed expression.',
  },
  {
    id: 'march10-0461',
    type: 'image',
    spriteIndex: 17,
    title: 'smile in the middle',
    date: '2026-03-10',
    note: 'One of those in-between smiles that feels more real than a perfect pose ♡',
    alt: 'Mirror photo with a cheerful smile in the middle of the photo session.',
  },
  {
    id: 'march10-0465',
    type: 'image',
    spriteIndex: 18,
    title: 'soft and unbothered',
    date: '2026-03-10',
    note: 'A quiet pose that looks like it knew it was already cute.',
    alt: 'Mirror photo with a soft relaxed expression and arms resting on the counter.',
  },
  {
    id: 'march10-0468',
    type: 'image',
    spriteIndex: 19,
    title: 'photographer mode on',
    date: '2026-03-10',
    note: 'The camera came a little closer and the mirror session officially became a whole event.',
    alt: 'Mirror photo holding the compact camera closer to the face.',
  },
];

function readStoredComments() {
  try {
    const stored = localStorage.getItem(COMMENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
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

function SpritePhoto({ index, label, className = '' }) {
  const column = index % 5;
  const row = Math.floor(index / 5);
  const positionX = column * 25;
  const positionY = row * (100 / 3);

  return (
    <div
      className={`sprite-photo ${className}`}
      role="img"
      aria-label={label}
      style={{
        backgroundImage: `url(${march10Sprite})`,
        backgroundPosition: `${positionX}% ${positionY}%`,
      }}
    />
  );
}

function MemoryVisual({ memory, mode = 'card' }) {
  if (memory.type === 'video') {
    return (
      <video
        src={memory.src}
        controls={mode === 'dialog'}
        muted={mode !== 'dialog'}
        preload="metadata"
        playsInline
      />
    );
  }

  if (Number.isInteger(memory.spriteIndex)) {
    return <SpritePhoto index={memory.spriteIndex} label={memory.alt || memory.title} className={`sprite-${mode}`} />;
  }

  return <img src={memory.src} alt={memory.alt || memory.title} />;
}

function App() {
  const [activeSection, setActiveSection] = useState('memories');
  const [memories, setMemories] = useState(march10Memories);
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
            <div className="hero-paper-note">March 10, 2026<br />mirror-photo chapter ♡</div>
            {march10Memories.slice(0, 3).map((memory, index) => (
              <button className={`hero-polaroid hero-p${index + 1}`} key={memory.id} type="button" onClick={() => openMemory(memory)}>
                <MemoryVisual memory={memory} mode="hero" />
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
              <p>Every photo gets its own little caption, and the comment space stays open for whatever the two of you want to say.</p>
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
                    <MemoryVisual memory={memory} mode="card" />
                    {memory.type === 'video' && <span className="video-badge">▶ video</span>}
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
            <div className="timeline-note">March 10, 2026 now has its own photo chapter</div>
          </div>

          <div className="timeline-list">
            {Object.entries(timelineGroups).map(([month, items]) => (
              <div className="timeline-group" key={month}>
                <div className="timeline-month"><span>{month}</span></div>
                <div className="timeline-items">
                  {items.map((memory) => (
                    <button className="timeline-memory" key={memory.id} type="button" onClick={() => openMemory(memory)}>
                      <div className="timeline-thumb">
                        <MemoryVisual memory={memory} mode="thumb" />
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
              <MemoryVisual memory={selectedMemory} mode="dialog" />
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
                  )) : <p className="no-comments">No comments yet — this space is yours. Write whatever this photo makes you want to say ♡</p>}
                </div>

                <form className="comment-form" onSubmit={addComment}>
                  <div className="member-toggle" aria-label="Comment as">
                    {MEMBERS.map((member) => (
                      <button className={commentAuthor === member ? 'active' : ''} type="button" key={member} onClick={() => setCommentAuthor(member)}>{member}</button>
                    ))}
                  </div>
                  <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength="500" placeholder="What do you want to say about this photo?" />
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
