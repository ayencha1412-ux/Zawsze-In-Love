const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiRequest(path, options = {}) {
  const opts = { credentials: 'include', ...options };

  if (opts.body && !(opts.body instanceof FormData) && typeof opts.body !== 'string') {
    opts.headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    opts.body = JSON.stringify(opts.body);
  }

  const response = await fetch(`${API_URL}${path}`, opts);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' ? payload.error : payload;
    const error = new Error(message || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}
