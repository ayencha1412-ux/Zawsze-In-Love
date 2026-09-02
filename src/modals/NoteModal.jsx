import Modal from '../components/Modal.jsx';
import { localDateTime } from '../lib/format.js';

export default function NoteModal({ item, onClose, onSubmit }) {
  return (
    <Modal title={item ? 'Edit note' : 'Write a note'} kicker="love notes" onClose={onClose}>
      <form className="modal-form" onSubmit={onSubmit}>
        <label className="field"><span>Your note</span><textarea name="body" rows="7" required maxLength="3000" defaultValue={item?.body || ''} /></label>
        <label className="field"><span>Open later <small>Optional sealed-letter date</small></span><input name="openAt" type="datetime-local" defaultValue={localDateTime(item?.openAt)} /></label>
        <div className="toggle-row">
          <label><input name="isPinned" type="checkbox" defaultChecked={item?.isPinned} /> Pin</label>
          <label><input name="isFavorite" type="checkbox" defaultChecked={item?.isFavorite} /> Favorite</label>
          <label><input name="isLocked" type="checkbox" defaultChecked={item?.isLocked} /> PIN lock</label>
        </div>
        <div className="modal-actions">
          <button className="btn soft" type="button" onClick={onClose}>Cancel</button>
          <button className="btn primary">Save note</button>
        </div>
      </form>
    </Modal>
  );
}
