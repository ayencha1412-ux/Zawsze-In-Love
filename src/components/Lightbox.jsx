import { formatDate } from '../lib/format.js';

export default function Lightbox({ data, onClose, setData }) {
  const files = data.item.files || [];
  const current = files[data.index];
  if (!current) return null;

  const previous = () => setData({ ...data, index: (data.index - 1 + files.length) % files.length });
  const next = () => setData({ ...data, index: (data.index + 1) % files.length });

  return (
    <div className="lightbox" role="presentation" onClick={onClose}>
      <button className="lightbox-close" type="button" onClick={onClose}>×</button>
      {files.length > 1 && <button className="lightbox-nav prev" type="button" onClick={(event) => { event.stopPropagation(); previous(); }}>‹</button>}
      <figure onClick={(event) => event.stopPropagation()}>
        <img src={current.url} alt={data.item.caption || data.item.title || 'Memory'} decoding="async" />
        <figcaption>{data.item.caption || data.item.title || 'Memory'}<small>{formatDate(data.item.memoryDate || data.item.eventDate)}</small></figcaption>
      </figure>
      {files.length > 1 && <button className="lightbox-nav next" type="button" onClick={(event) => { event.stopPropagation(); next(); }}>›</button>}
    </div>
  );
}
