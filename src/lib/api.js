const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? response.json() : response.text();
}

// Future examples:
// export const saveVisit = () => apiRequest('/visits', { method: 'POST' });
// export const submitReply = (message) => apiRequest('/replies', {
//   method: 'POST',
//   body: JSON.stringify({ message }),
// });
