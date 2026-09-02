import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';
import { formatDate } from '../lib/format.js';

export default function MemoryViewer({ memory, onClose, notify, onChanged }) {
  const [detail, setDetail] = useState(memory);
  const [loading, setLoading] = useState(true);
  const [commentDraft, setCommentDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setDetail(await apiRequest(`/api/memories/${memory.id}`));
    } catch (err) {
      notify(err.message);
    } finally {
      setLoading(false);
    }
  }, [memory.id, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const submitComment = async (event) => {
    event.preventDefault();
    const body = commentDraft.trim();
    if (!body) return;

    try {
      setBusy(true);
      await apiRequest(`/api/memories/${memory.id}/comments`, { method: 'POST', body: { body } });
      setCommentDraft('');
      await load();
      await onChanged();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeComment = async (comment) => {
    if (!window.confirm('Delete your comment?')) return;
    try {
      await apiRequest(`/api/memories/${memory.id}/comments/${comment.id}`, { method: 'DELETE' });
      await load();
      await onChanged();
    } catch (err) {
      notify(err.message);
    }
  };

  const file = detail?.files?.[0];

  return (
    <div className="memory-viewer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="memory-viewer" role="dialog" aria-modal="true" aria-label={detail?.caption || 'Memory'}>
        <button className="modal-close" type="button" onClick={onClose}>×</button>
        <div className="viewer-media">
          {loading ? <div className="viewer-placeholder">Opening memory…</div>
            : detail?.locked ? (
              <div className="viewer-placeholder lock-view"><span>🔒</span><strong>Private memory</strong><p>Unlock the couple PIN from Settings to view this memory.</p></div>
            ) : file?.mediaType === 'video' ? <video src={file.url} controls autoPlay={false} playsInline preload="metadata" />
              : file ? <img src={file.url} alt={detail.caption || 'Memory'} decoding="async" />
                : <div className="viewer-placeholder">♡</div>}
        </div>

        <aside className="viewer-sidebar">
          <div className="viewer-heading">
            <div className="eyebrow">saved memory</div>
            <h3>{detail?.caption || 'Untitled memory'}</h3>
            <p>{[formatDate(detail?.memoryDate), detail?.location, detail?.albumName].filter(Boolean).join(' · ')}</p>
            {detail?.description && <p className="viewer-memory-description">{detail.description}</p>}
            {detail?.uploadedBy && <small>Added by {detail.uploadedBy.name}</small>}
            {file?.downloadUrl && <a className="download-link" href={file.downloadUrl}>Download original</a>}
          </div>

          <div className="comment-thread">
            <div className="comment-thread-title"><strong>Comments</strong><span>{detail?.comments?.length || 0}</span></div>
            {detail?.locked ? <p className="empty-state">Unlock this memory to read its comments.</p>
              : detail?.comments?.length ? detail.comments.map((comment) => (
                <article className="viewer-comment" key={comment.id}>
                  <div><strong>{comment.authorName}</strong><time>{formatDate(comment.createdAt, true)}</time></div>
                  <p>{comment.body}</p>
                  {comment.mine && <button type="button" onClick={() => removeComment(comment)}>Delete</button>}
                </article>
              )) : <p className="empty-state">No comments yet. Leave the first one.</p>}
          </div>

          {!detail?.locked && (
            <form className="comment-form" onSubmit={submitComment}>
              <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} rows="3" maxLength="1500" placeholder="Say something about this memory…" />
              <button className="btn primary" disabled={busy || !commentDraft.trim()}>{busy ? 'Sending…' : 'Comment'}</button>
            </form>
          )}
        </aside>
      </section>
    </div>
  );
}
