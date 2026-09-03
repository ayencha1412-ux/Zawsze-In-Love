import Modal from '../components/Modal.jsx';
import TetrisHeartLoader from '../components/TetrisHeartLoader.jsx';

export default function TimelineModal({ item, onClose, onSubmit, progress = 0 }) {
  const busy = progress > 0;
  const finishing = progress >= 100;

  return (
    <Modal title={item ? 'Edit moment' : 'Add a moment'} kicker="our story" onClose={onClose}>
      <form className="modal-form" onSubmit={onSubmit}>
        <label className="field"><span>Title</span><input name="title" required maxLength="120" defaultValue={item?.title || ''} /></label>
        <div className="field-grid">
          <label className="field"><span>Date</span><input name="eventDate" type="date" defaultValue={item?.eventDate || ''} /></label>
          <label className="field">
            <span>Kind</span>
            <select name="eventType" defaultValue={item?.eventType || 'memory'}>
              <option value="memory">Memory</option><option value="first">First</option><option value="date">Date</option>
              <option value="trip">Trip</option><option value="anniversary">Anniversary</option><option value="achievement">Achievement</option>
            </select>
          </label>
        </div>
        <label className="field"><span>Description</span><textarea name="description" rows="5" maxLength="1800" defaultValue={item?.description || ''} /></label>
        {!item && <label className="field"><span>Photos</span><input name="photos[]" type="file" accept="image/*" multiple /></label>}
        <div className="toggle-row">
          <label><input name="isFavorite" type="checkbox" defaultChecked={item?.isFavorite} /> Favorite</label>
          <label><input name="isLocked" type="checkbox" defaultChecked={item?.isLocked} /> PIN lock</label>
        </div>
        {busy && (
          <>
            <div className="upload-progress" aria-live="polite">
              <span style={{ width: `${progress}%` }} />
              <small>{finishing ? 'Upload complete — saving moment…' : `Uploading… ${progress}%`}</small>
            </div>
            {finishing && (
              <div className="upload-heart-finish">
                <TetrisHeartLoader compact label="Adding this piece to your story…" />
              </div>
            )}
          </>
        )}
        <div className="modal-actions">
          <button className="btn soft" type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" disabled={busy}>{busy ? (finishing ? 'Saving…' : 'Uploading…') : 'Save moment'}</button>
        </div>
      </form>
    </Modal>
  );
}
