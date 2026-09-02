import { memo, useEffect, useState } from 'react';

function MemoryPreview({ file, alt }) {
  const [failed, setFailed] = useState(false);
  const previewUrl = file?.thumbnailUrl || null;

  useEffect(() => setFailed(false), [previewUrl]);

  if (!file) {
    return <div className="frame memory-placeholder">♡</div>;
  }

  if (!previewUrl || failed) {
    return (
      <div className={`frame memory-placeholder ${file.mediaType === 'video' ? 'video-placeholder' : ''}`}>
        <span>{file.mediaType === 'video' ? '▶' : '♡'}</span>
        {file.mediaType === 'video' && <small>Video</small>}
      </div>
    );
  }

  return (
    <div className="memory-preview-shell">
      <img
        className="frame"
        src={previewUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        onError={() => setFailed(true)}
      />
      {file.mediaType === 'video' && <span className="memory-video-play" aria-hidden="true">▶</span>}
    </div>
  );
}

export default memo(MemoryPreview);
