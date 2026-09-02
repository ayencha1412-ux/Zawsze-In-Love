import Modal from '../components/Modal.jsx';

export default function MemoryModal({ item, albums, onClose, onSubmit, progress = 0 }) {
  const busy = progress > 0;
  const finishing = progress >= 100;
  const progressText = finishing ? 'Upload complete — saving memory…' : `Uploading… ${progress}%`;

  return (
    <Modal title={item ? 'Edit memory' : 'Add memories'} kicker="the gallery" onClose={onClose}>
      <form className="modal-form" onSubmit={onSubmit}>
        {!item && (
          <label className="upload-drop">
            <input name="photos[]" type="file" accept="image/*,video/*" multiple required />
            <span className="upload-icon">＋</span>
            <strong>Choose photos or videos</strong>
            <small>Select many at once. On phones, your camera/gallery will be offered automatically.</small>
          </label>
        )}
        <label className="field">
          <span>Caption</span>
          <input name="caption" defaultValue={item?.caption || ''} maxLength="180" placeholder="What do you want to remember?" />
        </label>
        <label className="field">
          <span>Little description</span>
          <textarea name="description" rows="3" maxLength="2000" defaultValue={item?.description || ''} placeholder="Optional — leave blank and Zawsze will add a cute little description ♡" />
        </label>
        <div className="field-grid">
          <label className="field"><span>Memory date</span><input name="memoryDate" type="date" defaultValue={item?.memoryDate || ''} /></label>
          <label className="field"><span>Location</span><input name="location" defaultValue={item?.location || ''} maxLength="120" placeholder="Optional" /></label>
        </div>
        <label className="field">
          <span>Album</span>
          <select name="albumId" defaultValue={item?.albumId || ''}>
            <option value="">No album</option>
            {albums.map((album) => <option key={album.id} value={album.id}>{album.name}</option>)}
          </select>
        </label>
        <div className="toggle-row">
          <label><input name="isFavorite" type="checkbox" defaultChecked={item?.isFavorite} /> Favorite</label>
          <label><input name="isLocked" type="checkbox" defaultChecked={item?.isLocked} /> PIN lock</label>
        </div>
        {busy && (
          <div className="upload-progress" aria-live="polite">
            <span style={{ width: `${progress}%` }} />
            <small>{progressText}</small>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn soft" type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" disabled={busy}>{busy ? (finishing ? 'Saving…' : 'Uploading…') : 'Save memory'}</button>
        </div>
      </form>
    </Modal>
  );
}
