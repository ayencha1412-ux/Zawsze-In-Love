import { useEffect, useMemo, useRef, useState } from 'react';
import { addComment, getToken, listMemories, login, logout, me, uploadMemories } from './api';
import './backend.css';

function dateValue(value) {
  const time = new Date(`${value || ''}T12:00:00`).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function displayDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return 'No date yet';
  return new Intl.DateTimeFormat('en-US', options).format(new Date(`${value}T12:00:00`));
}

function commentTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value));
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
  return <img src={memory.src} alt={memory.title || 'Shared memory'} loading={mode === 'hero' ? 'eager' : 'lazy'} />;
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(email, password);
      await onLogin(user);
    } catch (err) {
      setError(err.message || 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="z-auth-screen">
      <div className="z-auth-card">
        <div className="z-auth-heart">♡</div>
        <span className="section-index">our private little space</span>
        <h1>Zawsze <em>in Love</em></h1>
        <p>Two accounts, one memory lane. Sign in to see the photos, videos, dates, and comments shared between you.</p>
        <form onSubmit={submit}>
          <label className="field"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
          <label className="field"><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
          {error && <div className="z-error">{error}</div>}
          <button className="btn primary z-auth-submit" type="submit" disabled={busy}>{busy ? 'Opening our space…' : 'Enter our space ♡'}</button>
        </form>
        <small>No public sign-up. Only the two seeded accounts can enter.</small>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [memories, setMemories] = useState([]);
  const [activeSection, setActiveSection] = useState('memories');
  const [mediaFilter, setMediaFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [error, setError] = useState('');
  const uploadInput = useRef(null);

  const refreshMemories = async (filter = mediaFilter, sort = sortOrder) => {
    const data = await listMemories({ type: filter, sort });
    setMemories(data);
    setSelectedMemory((current) => current ? data.find((item) => item.id === current.id) || null : null);
    return data;
  };

  useEffect(() => {
    const boot = async () => {
      if (!getToken()) {
        setBooting(false);
        return;
      }
      try {
        const currentUser = await me();
        setUser(currentUser);
        await refreshMemories('all', 'newest');
      } catch {
        localStorage.removeItem('zawsze-api-token');
      } finally {
        setBooting(false);
      }
    };
    boot();
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshMemories(mediaFilter, sortOrder).catch((err) => setError(err.message));
  }, [mediaFilter, sortOrder]);

  useEffect(() => {
    const sections = ['memories', 'timeline'].map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.1, 0.35] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [user, memories.length]);

  useEffect(() => {
    const close = (event) => {
      if (event.key === 'Escape') {
        setUploadOpen(false);
        setSelectedMemory(null);
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  const allForTimeline = useMemo(() => [...memories].sort((a, b) => dateValue(b.date) - dateValue(a.date)), [memories]);
  const timelineGroups = useMemo(() => allForTimeline.reduce((groups, memory) => {
    const label = displayDate(memory.date, { month: 'long', year: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(memory);
    return groups;
  }, {}), [allForTimeline]);

  const stats = useMemo(() => ({
    total: memories.length,
    photos: memories.filter((item) => item.type === 'image').length,
    videos: memories.filter((item) => item.type === 'video').length,
    comments: memories.reduce((sum, item) => sum + (item.comments?.length || 0), 0),
  }), [memories]);

  const featured = memories.slice(0, 3);

  const handleLoggedIn = async (currentUser) => {
    setUser(currentUser);
    await refreshMemories('all', 'newest');
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setMemories([]);
    setSelectedMemory(null);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!uploadFiles.length) return;
    const form = event.currentTarget;
    setUploadBusy(true);
    setError('');
    try {
      await uploadMemories({
        files: uploadFiles,
        caption: form.elements.caption.value.trim(),
        fallbackDate: form.elements.memoryDate.value,
        useFileDates: form.elements.useFileDates.checked,
      });
      form.reset();
      setUploadFiles([]);
      setUploadOpen(false);
      await refreshMemories();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploadBusy(false);
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();
    const body = commentDraft.trim();
    if (!selectedMemory || !body) return;
    setCommentBusy(true);
    try {
      const comment = await addComment(selectedMemory.id, body);
      const update = (item) => item.id === selectedMemory.id
        ? { ...item, comments: [...(item.comments || []), comment] }
        : item;
      setMemories((current) => current.map(update));
      setSelectedMemory((current) => current ? update(current) : current);
      setCommentDraft('');
    } catch (err) {
      setError(err.message || 'Comment could not be saved.');
    } finally {
      setCommentBusy(false);
    }
  };

  if (booting) {
    return <div className="z-loading"><span>♡</span><p>Opening Zawsze…</p></div>;
  }

  if (!user) return <LoginScreen onLogin={handleLoggedIn} />;

  const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
        <div className="z-user-menu">
          <div className="couple-lock"><span className="avatar-chip">{user.name?.[0] || 'Y'}</span><span>{user.name}</span></div>
          <button type="button" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">{user.space?.name || 'our private memory space'}</div>
            <h1 id="hero-title">Two people.<br /><em>One memory lane.</em></h1>
            <p className="lede">Photos, videos, dates, and little comments now live in the shared database — so both accounts see the same memories from any device.</p>
            <div className="hero-actions">
              <button className="btn primary" type="button" onClick={() => setUploadOpen(true)}>＋ Add memories</button>
              <button className="btn ghost" type="button" onClick={() => goTo('memories')}>Browse everything ↓</button>
            </div>
            <div className="hero-stats">
              <div><strong>{stats.total}</strong><span>memories</span></div>
              <div><strong>{stats.photos}</strong><span>photos</span></div>
              <div><strong>{stats.videos}</strong><span>videos</span></div>
              <div><strong>{stats.comments}</strong><span>comments</span></div>
            </div>
          </div>

          <div className={`hero-visual ${featured.length ? '' : 'z-empty-hero'}`}>
            <div className="hero-paper-note">our newest memories ♡</div>
            {featured.map((memory, index) => (
              <button className={`hero-polaroid hero-p${index + 1}`} key={memory.id} type="button" onClick={() => setSelectedMemory(memory)}>
                <MemoryVisual memory={memory} mode="hero" />
                <span className="polaroid-date">{displayDate(memory.date, { month: 'short', day: 'numeric' })}</span>
                <span className="polaroid-title">{memory.title}</span>
              </button>
            ))}
            {!featured.length && <div className="z-first-memory"><span>♡</span><strong>Our archive is ready.</strong><small>Upload the first photos or videos to fill this space.</small></div>}
          </div>
        </section>

        <section className="section" id="memories">
          <div className="section-heading-row">
            <div className="section-head">
              <span className="section-index">01 / our archive</span>
              <h2>Everything worth keeping.</h2>
              <p>These files are now backed by Laravel and private storage instead of disappearing after a browser refresh.</p>
            </div>
            <button className="btn primary" type="button" onClick={() => setUploadOpen(true)}>＋ Upload photos & videos</button>
          </div>

          {error && <div className="z-banner-error">{error}<button type="button" onClick={() => setError('')}>×</button></div>}

          <div className="memory-toolbar">
            <div className="filter-pills">
              {[['all', 'All'], ['image', 'Photos'], ['video', 'Videos']].map(([value, label]) => (
                <button className={`filter-pill ${mediaFilter === value ? 'active' : ''}`} key={value} type="button" onClick={() => setMediaFilter(value)}>{label}</button>
              ))}
            </div>
            <label className="sort-control"><span>Sort by date</span><select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
          </div>

          <div className="memory-grid">
            {memories.map((memory, index) => (
              <article className="memory-card" key={memory.id} style={{ '--tilt': `${[-1.2, 0.7, -0.4, 1.1][index % 4]}deg` }}>
                <button className="memory-media" type="button" onClick={() => setSelectedMemory(memory)}>
                  <MemoryVisual memory={memory} mode="card" />
                  {memory.type === 'video' && <span className="video-badge">▶ video</span>}
                </button>
                <div className="memory-meta">
                  <div><time>{displayDate(memory.date)}</time><h3>{memory.title}</h3></div>
                  <button className="comment-count" type="button" onClick={() => setSelectedMemory(memory)}>♡ {memory.comments?.length || 0}</button>
                </div>
                {memory.uploaded_by?.name && <p>Added by {memory.uploaded_by.name} ♡</p>}
              </article>
            ))}
          </div>

          {!memories.length && <div className="empty-state"><span>♡</span><h3>No memories here yet.</h3><button className="btn soft" type="button" onClick={() => setUploadOpen(true)}>Add the first one</button></div>}
        </section>

        <section className="section timeline-section" id="timeline">
          <div className="section-heading-row timeline-title-row">
            <div className="section-head"><span className="section-index">02 / by date</span><h2>Our timeline.</h2><p>Memories are grouped by the date they belong to, not just the day they were uploaded.</p></div>
            <div className="timeline-note">upload a whole camera roll — the dates keep it organized</div>
          </div>
          <div className="timeline-list">
            {Object.entries(timelineGroups).map(([month, items]) => (
              <div className="timeline-group" key={month}>
                <div className="timeline-month"><span>{month}</span></div>
                <div className="timeline-items">
                  {items.map((memory) => (
                    <button className="timeline-memory" key={memory.id} type="button" onClick={() => setSelectedMemory(memory)}>
                      <div className="timeline-thumb"><MemoryVisual memory={memory} mode="thumb" />{memory.type === 'video' && <span>▶</span>}</div>
                      <div><time>{displayDate(memory.date)}</time><strong>{memory.title}</strong><small>{memory.comments?.length || 0} comments</small></div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer><span className="footer-heart">♡</span><p>Zawsze in Love — one private archive for two people.</p><small>React + Laravel + private media storage</small></footer>

      {uploadOpen && (
        <div className="z-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setUploadOpen(false)}>
          <section className="z-modal-card" role="dialog" aria-modal="true" aria-labelledby="upload-title">
            <button className="z-modal-close" type="button" onClick={() => setUploadOpen(false)}>×</button>
            <span className="modal-kicker">add to our archive</span>
            <h2 id="upload-title">Upload memories</h2>
            <p>Choose one file or a whole batch. Photos and videos can be mixed together.</p>
            <form onSubmit={handleUpload}>
              <button className="z-upload-drop" type="button" onClick={() => uploadInput.current?.click()}>
                <input ref={uploadInput} type="file" accept="image/*,video/*" multiple onChange={(e) => setUploadFiles(Array.from(e.target.files || []))} />
                <span>＋</span><strong>{uploadFiles.length ? `${uploadFiles.length} file${uploadFiles.length === 1 ? '' : 's'} selected` : 'Choose photos & videos'}</strong><small>Bulk upload supported</small>
              </button>
              {uploadFiles.length > 0 && <div className="z-selected-files">{uploadFiles.slice(0, 5).map((file) => <span key={`${file.name}-${file.lastModified}`}>{file.name}</span>)}{uploadFiles.length > 5 && <span>+ {uploadFiles.length - 5} more</span>}</div>}
              <label className="field"><span>Shared caption <em>optional</em></span><input name="caption" maxLength="500" placeholder="Our little date / weekend away / just because…" /></label>
              <label className="field"><span>Fallback memory date</span><input name="memoryDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
              <label className="z-checkbox"><input name="useFileDates" type="checkbox" defaultChecked /><span>Use each file's date when available</span></label>
              <button className="btn primary z-full-button" type="submit" disabled={!uploadFiles.length || uploadBusy}>{uploadBusy ? 'Saving to our archive…' : `Save ${uploadFiles.length || ''} ${uploadFiles.length === 1 ? 'memory' : 'memories'} ♡`}</button>
            </form>
          </section>
        </div>
      )}

      {selectedMemory && (
        <div className="z-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelectedMemory(null)}>
          <section className="z-memory-dialog" role="dialog" aria-modal="true">
            <button className="z-modal-close" type="button" onClick={() => setSelectedMemory(null)}>×</button>
            <div className="z-dialog-media"><MemoryVisual memory={selectedMemory} mode="dialog" /></div>
            <div className="z-dialog-copy">
              <time>{displayDate(selectedMemory.date)}</time>
              <h2>{selectedMemory.title}</h2>
              {selectedMemory.uploaded_by?.name && <p className="z-uploaded-by">Added by {selectedMemory.uploaded_by.name}</p>}
              <div className="z-comments-head"><strong>Our comments</strong><span>{selectedMemory.comments?.length || 0}</span></div>
              <div className="z-comments-list">
                {(selectedMemory.comments || []).map((comment) => <div className="z-comment" key={comment.id}><strong>{comment.author}</strong><p>{comment.body}</p><small>{commentTime(comment.createdAt)}</small></div>)}
                {!selectedMemory.comments?.length && <div className="z-no-comments">No comments yet — this space is yours. Write whatever this photo makes you want to say ♡</div>}
              </div>
              <form className="z-comment-form" onSubmit={handleComment}><textarea value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} maxLength="2000" placeholder="What do you want to say about this memory?" /><button className="btn primary" type="submit" disabled={!commentDraft.trim() || commentBusy}>{commentBusy ? 'Saving…' : 'Comment ♡'}</button></form>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
