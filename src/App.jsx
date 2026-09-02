import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AuthScreen from './components/AuthScreen.jsx';
import Lightbox from './components/Lightbox.jsx';
import MemoryViewer from './components/MemoryViewer.jsx';
import MemoryModal from './modals/MemoryModal.jsx';
import NoteModal from './modals/NoteModal.jsx';
import TimelineModal from './modals/TimelineModal.jsx';
import SearchModal from './modals/SearchModal.jsx';
import NotificationModal from './modals/NotificationModal.jsx';
import SettingsModal from './modals/SettingsModal.jsx';
import HomeView from './views/HomeView.jsx';
import GalleryView from './views/GalleryView.jsx';
import NotesView from './views/NotesView.jsx';
import TimelineView from './views/TimelineView.jsx';
import FavoritesView from './views/FavoritesView.jsx';
import useDebouncedValue from './hooks/useDebouncedValue.js';
import useMemoryGallery from './hooks/useMemoryGallery.js';
import { apiRequest, apiUpload, setStoredToken } from './lib/api.js';
import { appendMediaPreviews } from './lib/mediaPreview.js';
import { blankSearch, firstNames, initials } from './lib/format.js';

const NAV_ITEMS = ['home', 'gallery', 'notes', 'timeline', 'favorites'];

export default function App() {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [view, setView] = useState('home');
  const [dashboard, setDashboard] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [notes, setNotes] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [favorites, setFavorites] = useState({ memories: [], notes: [], timeline: [] });
  const [onThisDay, setOnThisDay] = useState({ memories: [], timeline: [] });
  const [notifications, setNotifications] = useState([]);
  const [searchResults, setSearchResults] = useState(blankSearch);
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [galleryQuery, setGalleryQuery] = useState('');
  const [galleryAlbum, setGalleryAlbum] = useState('');
  const [galleryFavorite, setGalleryFavorite] = useState(false);
  const [galleryType, setGalleryType] = useState('all');
  const [gallerySort, setGallerySort] = useState('newest');
  const [timelineType, setTimelineType] = useState('');
  const [timelineFavorite, setTimelineFavorite] = useState(false);
  const [toast, setToast] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [viewerMemory, setViewerMemory] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const toastTimerRef = useRef(null);
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const notify = useCallback((message) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  const {
    memories,
    loading: memoryLoading,
    hasMore: memoryHasMore,
    loadMore: loadMoreMemories,
    reload: loadMemories,
  } = useMemoryGallery({
    enabled: Boolean(session && view === 'gallery'),
    query: galleryQuery,
    album: galleryAlbum,
    favorite: galleryFavorite,
    type: galleryType,
    sort: gallerySort,
    notify,
  });

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  const refreshSession = useCallback(async () => {
    const me = await apiRequest('/api/me');
    setSession(me);
    return me;
  }, []);

  const loadBase = useCallback(async () => {
    const [dash, albumList, day] = await Promise.all([
      apiRequest('/api/dashboard'),
      apiRequest('/api/albums'),
      apiRequest('/api/on-this-day'),
    ]);
    setDashboard(dash);
    setAlbums(albumList);
    setOnThisDay(day);
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      setNotes(await apiRequest('/api/notes'));
    } catch (err) {
      notify(err.message);
    }
  }, [notify]);

  const loadTimeline = useCallback(async () => {
    const params = new URLSearchParams();
    if (timelineType) params.set('type', timelineType);
    if (timelineFavorite) params.set('favorite', '1');
    try {
      setTimeline(await apiRequest(`/api/timeline?${params}`));
    } catch (err) {
      notify(err.message);
    }
  }, [timelineType, timelineFavorite, notify]);

  const loadFavorites = useCallback(async () => {
    try {
      setFavorites(await apiRequest('/api/favorites'));
    } catch (err) {
      notify(err.message);
    }
  }, [notify]);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const me = await apiRequest('/api/me');
        if (!active) return;
        setSession(me);
      } catch (err) {
        if (active) {
          if (err.status !== 401) console.error(err);
          setSession(null);
        }
      } finally {
        if (active) setInitializing(false);
      }
    };

    initialize();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!session || view !== 'notes') return;
    loadNotes();
  }, [session, view, loadNotes]);

  useEffect(() => {
    if (!session || view !== 'timeline') return;
    loadTimeline();
  }, [session, view, loadTimeline]);

  useEffect(() => {
    if (!session || view !== 'favorites') return;
    loadFavorites();
  }, [session, view, loadFavorites]);

  useEffect(() => {
    if (!session || view !== 'home') return;
    loadBase().catch((err) => notify(err.message));
  }, [session, view, loadBase, notify]);

  useEffect(() => {
    if (modal !== 'search' || debouncedSearchQuery.trim().length < 2) {
      if (debouncedSearchQuery.trim().length < 2) setSearchResults(blankSearch);
      return;
    }

    let active = true;
    apiRequest(`/api/search?q=${encodeURIComponent(debouncedSearchQuery.trim())}`)
      .then((result) => { if (active) setSearchResults(result); })
      .catch((err) => { if (active) notify(err.message); });

    return () => { active = false; };
  }, [debouncedSearchQuery, modal, notify]);

  const partnerNames = useMemo(() => firstNames(session?.couple?.members), [session]);
  const allOnThisDay = useMemo(() => [
    ...(onThisDay.memories || []).map((item) => ({
      ...item,
      kind: 'memory',
      title: item.caption || 'A memory',
      date: item.memory_date,
      description: item.description || item.location,
    })),
    ...(onThisDay.timeline || []).map((item) => ({
      ...item,
      kind: 'timeline',
      date: item.event_date,
      description: item.description,
    })),
  ], [onThisDay]);

  const openEdit = useCallback((type, item) => {
    setEditing(item || null);
    setModal(type);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setEditing(null);
  }, []);

  const reloadCurrentView = useCallback(async () => {
    if (view === 'gallery') await loadMemories();
    if (view === 'notes') await loadNotes();
    if (view === 'timeline') await loadTimeline();
    if (view === 'favorites') await loadFavorites();
  }, [view, loadMemories, loadNotes, loadTimeline, loadFavorites]);

  const saveMemory = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    try {
      if (editing) {
        await apiRequest(`/api/memories/${editing.id}`, {
          method: 'PATCH',
          body: {
            caption: form.caption.value,
            description: form.description.value,
            memoryDate: form.memoryDate.value,
            location: form.location.value,
            albumId: form.albumId.value,
            isFavorite: form.isFavorite.checked,
            isLocked: form.isLocked.checked,
          },
        });
      } else {
        const data = new FormData(form);
        const files = Array.from(form.elements['photos[]']?.files || []);
        files.forEach((file) => {
          if (!file.lastModified) return;
          const date = new Date(file.lastModified);
          const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
          data.append('fileDates[]', local.toISOString().slice(0, 10));
        });

        setUploadProgress(1);
        await appendMediaPreviews(data, files);
        await apiUpload('/api/memories', data, setUploadProgress);
      }

      closeModal();
      setUploadProgress(0);
      await Promise.all([loadMemories(), loadBase()]);
      notify(editing ? 'Memory updated.' : 'Memory saved.');
    } catch (err) {
      setUploadProgress(0);
      notify(err.message);
    }
  };

  const deleteMemory = async (memory) => {
    if (!window.confirm(`Delete “${memory.caption || 'this memory'}”?`)) return;
    try {
      await apiRequest(`/api/memories/${memory.id}`, { method: 'DELETE' });
      await Promise.all([loadMemories(), loadBase()]);
      notify('Memory removed.');
    } catch (err) {
      notify(err.message);
    }
  };

  const toggleMemoryFavorite = async (memory) => {
    try {
      await apiRequest(`/api/memories/${memory.id}`, {
        method: 'PATCH',
        body: { isFavorite: !memory.isFavorite },
      });
      await Promise.all([loadMemories(), loadBase()]);
    } catch (err) {
      notify(err.message);
    }
  };

  const saveNote = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = {
      body: form.body.value,
      openAt: form.openAt.value ? new Date(form.openAt.value).toISOString().slice(0, 19) : '',
      isPinned: form.isPinned.checked,
      isFavorite: form.isFavorite.checked,
      isLocked: form.isLocked.checked,
    };

    try {
      await apiRequest(editing ? `/api/notes/${editing.id}` : '/api/notes', {
        method: editing ? 'PATCH' : 'POST',
        body,
      });
      closeModal();
      await Promise.all([loadNotes(), loadBase()]);
      notify(editing ? 'Note updated.' : 'Note saved.');
    } catch (err) {
      notify(err.message);
    }
  };

  const deleteNote = async (note) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await apiRequest(`/api/notes/${note.id}`, { method: 'DELETE' });
      await Promise.all([loadNotes(), loadBase()]);
      notify('Note removed.');
    } catch (err) {
      notify(err.message);
    }
  };

  const heartNote = async (note) => {
    try {
      await apiRequest(`/api/notes/${note.id}/heart`, { method: 'POST' });
      await loadNotes();
    } catch (err) {
      notify(err.message);
    }
  };

  const toggleNoteFavorite = async (note) => {
    try {
      await apiRequest(`/api/notes/${note.id}`, { method: 'PATCH', body: { isFavorite: !note.isFavorite } });
      await Promise.all([loadNotes(), loadBase()]);
    } catch (err) {
      notify(err.message);
    }
  };

  const saveTimeline = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    try {
      if (editing) {
        await apiRequest(`/api/timeline/${editing.id}`, {
          method: 'PATCH',
          body: {
            title: form.title.value,
            eventDate: form.eventDate.value,
            eventType: form.eventType.value,
            description: form.description.value,
            isFavorite: form.isFavorite.checked,
            isLocked: form.isLocked.checked,
          },
        });
      } else {
        setUploadProgress(1);
        await apiUpload('/api/timeline', new FormData(form), setUploadProgress);
      }

      closeModal();
      setUploadProgress(0);
      await Promise.all([loadTimeline(), loadBase()]);
      notify(editing ? 'Moment updated.' : 'Moment added.');
    } catch (err) {
      setUploadProgress(0);
      notify(err.message);
    }
  };

  const deleteTimeline = async (item) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    try {
      await apiRequest(`/api/timeline/${item.id}`, { method: 'DELETE' });
      await Promise.all([loadTimeline(), loadBase()]);
      notify('Moment removed.');
    } catch (err) {
      notify(err.message);
    }
  };

  const toggleTimelineFavorite = async (item) => {
    try {
      await apiRequest(`/api/timeline/${item.id}`, { method: 'PATCH', body: { isFavorite: !item.isFavorite } });
      await Promise.all([loadTimeline(), loadBase()]);
    } catch (err) {
      notify(err.message);
    }
  };

  const openNotifications = async () => {
    try {
      const list = await apiRequest('/api/notifications');
      setNotifications(list);
      setModal('notifications');
      await apiRequest('/api/notifications/read', { method: 'POST' });
      await loadBase();
    } catch (err) {
      notify(err.message);
    }
  };

  const handleUnlock = async (pin) => {
    try {
      await apiRequest('/api/couple/unlock', { method: 'POST', body: { pin } });
      await refreshSession();
      await loadBase();
      await reloadCurrentView();
      notify('Private memories unlocked for 15 minutes.');
    } catch (err) {
      notify(err.message);
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken('');
      setSession(null);
      closeModal();
    }
  };

  if (initializing) {
    return <div className="loading-screen"><span className="brand-mark large">♡</span><p>Opening Zawsze…</p></div>;
  }

  if (!session) {
    return (
      <AuthScreen
        onAuthenticated={async () => {
          await refreshSession();
          setView('home');
        }}
      />
    );
  }

  return (
    <div className="site-shell">
      {toast && <div className="toast show">{toast}</div>}

      <header className="navbar app-navbar">
        <button className="brand" type="button" onClick={() => setView('home')}>
          <span className="brand-mark">♡</span><span>Zawsze In Love</span>
        </button>
        <nav className="pill-group app-pills">
          {NAV_ITEMS.map((item) => (
            <button key={item} className={`pill ${view === item ? 'is-active' : ''}`} type="button" onClick={() => setView(item)}>
              {item === 'notes' ? 'Love Notes' : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
        <div className="nav-actions">
          <button className="round-nav" type="button" onClick={() => { setSearchQuery(''); setSearchResults(blankSearch); setModal('search'); }} aria-label="Search">⌕</button>
          <button className="round-nav notify-button" type="button" onClick={openNotifications} aria-label="Notifications">
            ♡{dashboard?.unreadNotifications > 0 && <span>{dashboard.unreadNotifications}</span>}
          </button>
          <button className="avatar-button" type="button" onClick={() => setModal('settings')}>
            {session.user.avatarUrl ? <img src={session.user.avatarUrl} alt={session.user.name} /> : initials(session.user.name)}
          </button>
        </div>
      </header>

      <main className="app-main">
        {view === 'home' && (
          <HomeView
            session={session}
            partnerNames={partnerNames}
            dashboard={dashboard}
            onThisDayItems={allOnThisDay}
            onNavigate={setView}
          />
        )}

        {view === 'gallery' && (
          <GalleryView
            memories={memories}
            albums={albums}
            query={galleryQuery}
            setQuery={setGalleryQuery}
            album={galleryAlbum}
            setAlbum={setGalleryAlbum}
            type={galleryType}
            setType={setGalleryType}
            sort={gallerySort}
            setSort={setGallerySort}
            favorite={galleryFavorite}
            setFavorite={setGalleryFavorite}
            loading={memoryLoading}
            hasMore={memoryHasMore}
            onLoadMore={loadMoreMemories}
            onAdd={() => openEdit('memory', null)}
            onOpen={setViewerMemory}
            onFavorite={toggleMemoryFavorite}
            onEdit={(memory) => openEdit('memory', memory)}
            onDelete={deleteMemory}
          />
        )}

        {view === 'notes' && (
          <NotesView
            notes={notes}
            currentUserId={session.user.id}
            onAdd={() => openEdit('note', null)}
            onHeart={heartNote}
            onFavorite={toggleNoteFavorite}
            onEdit={(note) => openEdit('note', note)}
            onDelete={deleteNote}
          />
        )}

        {view === 'timeline' && (
          <TimelineView
            timeline={timeline}
            type={timelineType}
            setType={setTimelineType}
            favorite={timelineFavorite}
            setFavorite={setTimelineFavorite}
            onAdd={() => openEdit('timeline', null)}
            onFavorite={toggleTimelineFavorite}
            onEdit={(item) => openEdit('timeline', item)}
            onDelete={deleteTimeline}
            onPhotoOpen={(item, index) => setLightbox({ item, index })}
          />
        )}

        {view === 'favorites' && <FavoritesView favorites={favorites} onOpenMemory={setViewerMemory} />}
      </main>

      <nav className="mobile-nav">
        {NAV_ITEMS.map((item) => (
          <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>
            <span>{item === 'home' ? '⌂' : item === 'gallery' ? '▦' : item === 'notes' ? '♡' : item === 'favorites' ? '★' : '⌁'}</span>
            {item === 'notes' ? 'Notes' : item}
          </button>
        ))}
      </nav>

      {modal === 'memory' && <MemoryModal item={editing} albums={albums} onClose={closeModal} onSubmit={saveMemory} progress={uploadProgress} />}
      {modal === 'note' && <NoteModal item={editing} onClose={closeModal} onSubmit={saveNote} />}
      {modal === 'timeline' && <TimelineModal item={editing} onClose={closeModal} onSubmit={saveTimeline} progress={uploadProgress} />}
      {modal === 'search' && (
        <SearchModal
          query={searchQuery}
          setQuery={setSearchQuery}
          results={searchResults}
          onClose={closeModal}
          navigate={(target) => { setView(target); closeModal(); }}
        />
      )}
      {modal === 'notifications' && <NotificationModal notifications={notifications} onClose={closeModal} />}
      {modal === 'settings' && (
        <SettingsModal
          session={session}
          albums={albums}
          onClose={closeModal}
          onRefresh={async () => { await refreshSession(); await loadBase(); }}
          reloadAlbums={async () => setAlbums(await apiRequest('/api/albums'))}
          notify={notify}
          handleUnlock={handleUnlock}
          logout={logout}
        />
      )}
      {viewerMemory && (
        <MemoryViewer
          memory={viewerMemory}
          onClose={() => setViewerMemory(null)}
          notify={notify}
          onChanged={async () => { await Promise.all([loadMemories(), loadBase()]); }}
        />
      )}
      {lightbox && <Lightbox data={lightbox} onClose={() => setLightbox(null)} setData={setLightbox} />}
    </div>
  );
}
