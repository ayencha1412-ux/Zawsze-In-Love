import Modal from '../components/Modal.jsx';
import { formatDate } from '../lib/format.js';

export default function NotificationModal({ notifications, onClose }) {
  return (
    <Modal title="Notifications" kicker="your person" onClose={onClose}>
      <div className="notifications-list">
        {notifications.length ? notifications.map((item) => (
          <article key={item.id} className={`notification ${item.readAt ? '' : 'unread'}`}>
            <p>{item.message}</p><time>{formatDate(item.createdAt, true)}</time>
          </article>
        )) : <p className="empty-state">Nothing new — just the two of you.</p>}
      </div>
    </Modal>
  );
}
