import { useEffect, useMemo, useRef, useState } from 'react';
import photo1 from './assets/photo-1.webp';
import photo2 from './assets/photo-2.webp';
import photo3 from './assets/photo-3.webp';

const seedPhotos = [
  { id: 1, src: photo1, caption: 'that one afternoon', alt: 'A memory worth keeping' },
  { id: 2, src: photo2, caption: 'still my favorite', alt: 'A favorite saved memory' },
  { id: 3, src: photo3, caption: 'just because', alt: 'A simple memory worth saving' },
];

const seedNotes = [
  { id: 1, author: 'You', body: 'saving this here so I never lose it.', time: 'Aug 12' },
  { id: 2, author: 'Me', body: 'this is going to be a nice little archive of us.', time: 'Aug 14' },
];

const seedMoments = [
  { id: 1, date: 'Jan 2026', title: 'Where it started', desc: 'The first real conversation.' },
  { id: 2, date: 'Mar 2026', title: 'The trip', desc: 'A little chapter worth remembering.' },
  { id: 3, date: 'Sep 2026', title: 'This little site', desc: 'Built to keep the things we do not want to lose.' },
];

const STORAGE = {
  notes: 'zawsze-notes-v1',
  moments: 'zawsze-moments-v1',
};

function readStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [active, setActive] = useState('gallery');
  const [photos, setPhotos] = useState(seedPhotos);
  const [notes, setNotes] = useState(() => readStored(STORAGE.notes, seedNotes));
  const [moments, setMoments] = useState(() => readStored(STORAGE.moments, seedMoments));
  const [uploadOpen, setUploadOpen] = useState(false);
  const [momentOpen, setMomentOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const uploadInput = useRef(null);

  useEffect(() => localStorage.setItem(STORAGE.notes, JSON.stringify(notes)), [notes]);
  useEffect(() => localStorage.setItem(STORAGE.moments, JSON.stringify(moments)), [moments]);

  useEffect(() => {
    const ids = ['gallery', 'messages', 'timeline'];
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-22% 0px -58% 0px', threshold: [0, .1, .35] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setUploadOpen(false);
        setMomentOpen(false);
        setLightbox(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const totalKeepsakes = useMemo(() => photos.length + notes.length + moments.length, [photos, notes, moments]);

  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const addPhoto = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.elements.photo?.files?.[0];
    const caption = form.elements.caption?.value?.trim() || 'untitled memory';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotos((current) => [{ id: Date.now(), src: reader.result, caption, alt: caption }, ...current]);
      form.reset();
      setUploadOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const addNote = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const author = form.elements.author.value.trim();
    const body = form.elements.body.value.trim();
    if (!author || !body) return;
    setNotes((current) => [...current, { id: Date.now(), author, body, time: 'just now' }]);
    form.reset();
  };

  const addMoment = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const title = form.elements.title.value.trim();
    const dateValue = form.elements.date.value;
    const desc = form.elements.description.value.trim();
    if (!title) return;
    const prettyDate = dateValue
      ? new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(`${dateValue}T00:00:00`))
      : '';
    setMoments((current) => [...current, { id: Date.now(), title, date: prettyDate, desc }]);
    form.reset();
    setMomentOpen(false);
  };

  return (
    <div className="site-shell">
      <header className="navbar">
        <button className="brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
          <span className="brand-mark">♡</span>
          <span>Zawsze</span>
        </button>
        <nav className="pill-group" aria-label="Memory lane sections">
          {['gallery', 'messages', 'timeline'].map((id) => (
            <button key={id} className={`pill ${active === id ? 'is-active' : ''}`} type="button" onClick={() => goTo(id)}>
              {id[0].toUpperCase() + id.slice(1)}
            </button>
          ))}
        </nav>
        <div className="nav-count" title="Saved keepsakes">{totalKeepsakes} saved</div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-text hero-reveal">
            <div className="eyebrow">our little corner of the internet</div>
            <h1 id="hero-title">Every little thing<br /><em>worth keeping.</em></h1>
            <p className="lede">A quiet place for the photos, words, and moments we do not want to lose in a camera roll.</p>
            <div className="hero-actions">
              <button className="btn primary" type="button" onClick={() => goTo('gallery')}>Open the gallery <span>↘</span></button>
              <span className="microcopy">pink, red & beige — kept soft on purpose</span>
            </div>
          </div>

          <div className="hero-stack" aria-label="Featured memories">
            {seedPhotos.map((photo, index) => (
              <button key={photo.id} className={`hero-polaroid p${index + 1}`} type="button" onClick={() => setLightbox(photo)}>
                <img src={photo.src} alt={photo.alt} />
                <span className="tag">{photo.caption}</span>
              </button>
            ))}
            <span className="doodle doodle-one" aria-hidden="true">♡</span>
            <span className="doodle doodle-two" aria-hidden="true">✦</span>
          </div>
        </section>

        <section className="section" id="gallery">
          <div className="gallery-toolbar">
            <div className="section-head">
              <span className="section-index">01</span>
              <h2>The gallery</h2>
              <p>Every picture, kept the way it deserves.</p>
            </div>
            <button className="btn primary" type="button" onClick={() => setUploadOpen(true)}>＋ Add a photo</button>
          </div>

          <div className="gallery" aria-live="polite">
            {photos.map((photo, index) => (
              <button className="gcard" type="button" key={photo.id} onClick={() => setLightbox(photo)} style={{ '--r': `${[-2.4, 1.8, -1, 2.8][index % 4]}deg` }}>
                <img className="frame" src={photo.src} alt={photo.alt || photo.caption} />
                <span className="cap">{photo.caption}</span>
                <span className="photo-no">0{index + 1}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section section-wash" id="messages">
          <div className="section-head">
            <span className="section-index">02</span>
            <h2>The messages</h2>
            <p>Words worth saving, in the order they were said.</p>
          </div>

          <div className="messages-layout">
            <div className="notes" aria-live="polite">
              {notes.map((note) => (
                <article className="note" key={note.id}>
                  <div className="note-head">
                    <span className="note-author">{note.author}</span>
                    <time className="note-time">{note.time}</time>
                  </div>
                  <p className="note-body">{note.body}</p>
                </article>
              ))}
            </div>

            <form className="composer" onSubmit={addNote}>
              <div className="composer-heading">
                <span className="mini-heart">♡</span>
                <div><strong>Leave something here</strong><small>Saved on this browser for now.</small></div>
              </div>
              <label>
                <span>Your name</span>
                <input name="author" type="text" placeholder="Name" required maxLength="40" />
              </label>
              <label>
                <span>Message</span>
                <textarea name="body" placeholder="Write something worth keeping..." required maxLength="600" />
              </label>
              <button className="btn primary" type="submit">Save message ♡</button>
            </form>
          </div>
        </section>

        <section className="section" id="timeline">
          <div className="timeline-head">
            <div className="section-head">
              <span className="section-index">03</span>
              <h2>The timeline</h2>
              <p>How it has gone so far.</p>
            </div>
            <button className="btn soft" type="button" onClick={() => setMomentOpen(true)}>＋ Add a moment</button>
          </div>

          <ol className="thread">
            {moments.map((moment, index) => (
              <li className="t-item" key={moment.id}>
                <span className="thread-dot" aria-hidden="true" />
                <div className="t-date">{moment.date || `Moment ${index + 1}`}</div>
                <div className="t-title">{moment.title}</div>
                {moment.desc && <p className="t-desc">{moment.desc}</p>}
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer>
        <span className="footer-heart">♡</span>
        <p>pink, red, and beige — for the things worth remembering.</p>
        <small>Frontend 4 · ready to connect to the Zawsze API</small>
      </footer>

      {uploadOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setUploadOpen(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
            <button className="modal-close" type="button" onClick={() => setUploadOpen(false)} aria-label="Close">×</button>
            <div className="modal-kicker">new keepsake</div>
            <h3 id="upload-title">Add a photo</h3>
            <form className="modal-form" onSubmit={addPhoto}>
              <label className="upload-drop" onClick={() => uploadInput.current?.click()}>
                <input ref={uploadInput} name="photo" type="file" accept="image/*" required />
                <span className="upload-icon">＋</span>
                <strong>Choose a photo</strong>
                <small>JPG, PNG, WEBP or HEIC</small>
              </label>
              <label className="field"><span>Caption</span><input name="caption" maxLength="60" placeholder="A little note about it" /></label>
              <div className="modal-actions">
                <button type="button" className="btn soft" onClick={() => setUploadOpen(false)}>Cancel</button>
                <button type="submit" className="btn primary">Save photo</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {momentOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setMomentOpen(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="moment-title">
            <button className="modal-close" type="button" onClick={() => setMomentOpen(false)} aria-label="Close">×</button>
            <div className="modal-kicker">another chapter</div>
            <h3 id="moment-title">Add a moment</h3>
            <form className="modal-form" onSubmit={addMoment}>
              <label className="field"><span>Title</span><input name="title" required maxLength="80" placeholder="What happened?" /></label>
              <label className="field"><span>Date</span><input name="date" type="date" /></label>
              <label className="field"><span>Description</span><textarea name="description" maxLength="300" placeholder="A short memory..." /></label>
              <div className="modal-actions">
                <button type="button" className="btn soft" onClick={() => setMomentOpen(false)}>Cancel</button>
                <button type="submit" className="btn primary">Save moment</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {lightbox && (
        <div className="lightbox" role="presentation" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" type="button" onClick={() => setLightbox(null)} aria-label="Close photo">×</button>
          <figure onClick={(event) => event.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.alt || lightbox.caption} />
            <figcaption>{lightbox.caption}</figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}

export default App;
