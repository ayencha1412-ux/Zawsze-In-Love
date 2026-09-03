import MemoryCard from '../components/MemoryCard.jsx';
import TetrisHeartLoader from '../components/TetrisHeartLoader.jsx';

export default function GalleryView({
  memories,
  albums,
  query,
  setQuery,
  album,
  setAlbum,
  type,
  setType,
  sort,
  setSort,
  favorite,
  setFavorite,
  loading,
  hasMore,
  onLoadMore,
  onAdd,
  onOpen,
  onFavorite,
  onEdit,
  onDelete,
}) {
  return (
    <section className="section app-section">
      <div className="gallery-toolbar">
        <div className="section-head">
          <span className="section-index">01</span>
          <h2>The gallery</h2>
          <p>Every picture, kept the way it deserves.</p>
        </div>
        <button className="btn primary" onClick={onAdd}>＋ Add memory</button>
      </div>

      <div className="filter-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search captions or places…" />
        <select value={album} onChange={(event) => setAlbum(event.target.value)}>
          <option value="">All albums</option>
          {albums.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">Photos & videos</option>
          <option value="image">Photos only</option>
          <option value="video">Videos only</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <label className="check-chip">
          <input type="checkbox" checked={favorite} onChange={(event) => setFavorite(event.target.checked)} /> Favorites
        </label>
      </div>

      <div className="gallery" aria-busy={loading}>
        {memories.length ? memories.map((memory, index) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            index={index}
            onOpen={onOpen}
            onFavorite={onFavorite}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )) : !loading && <p className="empty-state">No memories here yet. Add the first one.</p>}
      </div>

      {loading && (
        <div className="gallery-heart-loader">
          <TetrisHeartLoader compact label={memories.length ? 'Bringing in more memories…' : 'Building your gallery…'} />
        </div>
      )}
      {!loading && hasMore && (
        <div className="gallery-load-more">
          <button className="btn soft" type="button" onClick={onLoadMore}>Load more memories</button>
        </div>
      )}
    </section>
  );
}
