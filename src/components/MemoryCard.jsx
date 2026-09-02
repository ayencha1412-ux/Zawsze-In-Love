import { memo } from 'react';
import { formatDate } from '../lib/format.js';
import MemoryPreview from './MemoryPreview.jsx';

function MemoryCard({ memory, index = 0, onOpen, onFavorite, onEdit, onDelete, compact = false }) {
  const file = memory.files?.[0];
  const rotation = compact ? [-1.6, 1.2, -0.8][index % 3] : [-2.4, 1.8, -1, 2.8][index % 4];

  return (
    <article className="gcard memory-card" style={{ '--r': `${rotation}deg` }}>
      <button className="memory-image-button" type="button" onClick={() => onOpen(memory)}>
        {memory.locked ? (
          <div className="frame memory-placeholder locked-tile">🔒</div>
        ) : (
          <MemoryPreview file={file} alt={memory.caption || 'Memory'} />
        )}
      </button>

      {memory.files?.length > 1 && <span className="photo-stack-count">{memory.files.length}</span>}
      <span className="cap">{memory.caption || 'untitled memory'}</span>
      <div className="memory-details">
        {[formatDate(memory.memoryDate), memory.location, memory.albumName, memory.commentsCount ? `${memory.commentsCount} comments` : null]
          .filter(Boolean)
          .join(' · ')}
      </div>

      {!compact && (onFavorite || onEdit || onDelete) && (
        <div className="card-actions">
          {onFavorite && (
            <button type="button" className={memory.isFavorite ? 'is-on' : ''} onClick={() => onFavorite(memory)}>♥</button>
          )}
          {onEdit && <button type="button" onClick={() => onEdit(memory)}>Edit</button>}
          {onDelete && <button type="button" onClick={() => onDelete(memory)}>Delete</button>}
        </div>
      )}
    </article>
  );
}

export default memo(MemoryCard);
