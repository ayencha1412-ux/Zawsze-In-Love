const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const currentHost = globalThis.location?.hostname || '';
const configuredUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = configuredUrl || (LOCAL_HOSTS.has(currentHost) ? 'http://localhost:8000/api' : '/api');

const TOKEN_KEY = 'zawsze-auth-token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}

export async function apiRequest(path, options = {}) {
  const token = getStoredToken();
  const isFormData = options.body instanceof FormData;
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error(`Cannot reach the Zawsze backend at ${API_URL}. If you are developing locally, make sure Laravel is running on port 8000.`);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message = typeof data === 'object' ? data?.message : data;
    if (response.status === 401) setStoredToken('');
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  me: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

export const memoryApi = {
  list: ({ type = 'all', sort = 'newest' } = {}) => {
    const params = new URLSearchParams({ type, sort });
    return apiRequest(`/memories?${params.toString()}`);
  },

  show: (memoryId) => apiRequest(`/memories/${memoryId}`),

  uploadMany: (files, { caption = '', fallbackDate = '', useFileDates = true } = {}) => {
    const form = new FormData();
    files.forEach((file) => form.append('files[]', file));
    form.append('caption', caption);
    form.append('fallback_date', fallbackDate);
    form.append('use_file_dates', useFileDates ? '1' : '0');
    return apiRequest('/memories/bulk', { method: 'POST', body: form });
  },

  update: (memoryId, values) => apiRequest(`/memories/${memoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
  }),

  remove: (memoryId) => apiRequest(`/memories/${memoryId}`, { method: 'DELETE' }),
};

export const commentApi = {
  list: (memoryId) => apiRequest(`/memories/${memoryId}/comments`),
  create: (memoryId, body) => apiRequest(`/memories/${memoryId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  }),
  remove: (memoryId, commentId) => apiRequest(`/memories/${memoryId}/comments/${commentId}`, {
    method: 'DELETE',
  }),
};

export const healthApi = () => apiRequest('/health');
