const PREVIEW_MAX_EDGE = 960;
const PREVIEW_QUALITY = 0.78;

function canvasToBlob(canvas, type = 'image/webp', quality = PREVIEW_QUALITY) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function drawScaled(source, width, height) {
  const scale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d', { alpha: false });
  context.drawImage(source, 0, 0, targetWidth, targetHeight);
  return canvas;
}

async function imagePreview(file) {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = drawScaled(bitmap, bitmap.width, bitmap.height);
      return await canvasToBlob(canvas);
    } finally {
      bitmap.close?.();
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    const canvas = drawScaled(image, image.naturalWidth, image.naturalHeight);
    return await canvasToBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function videoPoster(file) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;

  try {
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
      video.src = url;
    });

    const targetTime = Number.isFinite(video.duration) && video.duration > 0.2
      ? Math.min(0.5, video.duration / 3)
      : 0;

    if (targetTime > 0) {
      await new Promise((resolve) => {
        const done = () => resolve();
        video.onseeked = done;
        video.currentTime = targetTime;
        window.setTimeout(done, 1200);
      });
    }

    if (!video.videoWidth || !video.videoHeight) return null;
    const canvas = drawScaled(video, video.videoWidth, video.videoHeight);
    return await canvasToBlob(canvas);
  } catch {
    return null;
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

async function createPreview(file) {
  try {
    if (file.type.startsWith('image/')) return await imagePreview(file);
    if (file.type.startsWith('video/')) return await videoPoster(file);
  } catch {
    return null;
  }
  return null;
}

export async function appendMediaPreviews(formData, files, concurrency = 3) {
  const queue = files.map((file, index) => ({ file, index }));
  const results = [];

  async function worker() {
    while (queue.length) {
      const item = queue.shift();
      const blob = await createPreview(item.file);
      if (blob) results.push({ ...item, blob });
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length || 1) }, worker));
  results.sort((a, b) => a.index - b.index);

  results.forEach(({ blob, index }) => {
    formData.append('previews[]', blob, `preview-${index}.webp`);
    formData.append('previewIndexes[]', String(index));
  });

  return formData;
}
