const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const TOKEN_KEY = 'zawsze-api-token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');

  const isFormData = options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const validation = data?.errors ? Object.values(data.errors).flat().join(' ') : '';
    const error = new Error(validation || data?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
}

export async function me() {
  return (await request('/auth/me')).user;
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } finally {
    setToken('');
  }
}

export async function listMemories({ type = 'all', sort = 'newest' } = {}) {
  const params = new URLSearchParams();
  if (type !== 'all') params.set('type', type);
  params.set('sort', sort);
  const query = params.toString();
  return (await request(`/memories${query ? `?${query}` : ''}`)).memories;
}

export async function uploadMemories({ files, caption, fallbackDate, useFileDates = true }) {
  const form = new FormData();
  files.forEach((file) => form.append('files[]', file));

  if (caption) form.append('caption', caption);
  if (fallbackDate) form.append('fallback_date', fallbackDate);

  files.forEach((file) => {
    if (!useFileDates || !file.lastModified) {
      form.append('file_dates[]', fallbackDate || '');
      return;
    }

    const sourceDate = new Date(file.lastModified);
    const localDate = new Date(sourceDate.getTime() - sourceDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    form.append('file_dates[]', localDate);
  });

  return (await request('/memories/bulk', { method: 'POST', body: form })).memories;
}

export async function addComment(memoryId, body) {
  return (await request(`/memories/${memoryId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })).comment;
}

export async function deleteComment(memoryId, commentId) {
  return request(`/memories/${memoryId}/comments/${commentId}`, { method: 'DELETE' });
}

export async function deleteMemory(memoryId) {
  return request(`/memories/${memoryId}`, { method: 'DELETE' });
}
