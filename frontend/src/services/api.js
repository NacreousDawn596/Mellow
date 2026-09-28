// Thin fetch wrapper around the Mellow backend.
// Uses same-origin relative URLs (works in prod + via Vite dev proxy).
// Set VITE_API_BASE to point at an external backend if ever needed.

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    let detail = 'Something went wrong.';
    let code = 'network_error';
    try {
      const body = await res.json();
      detail = body.detail?.message || body.detail || body.message || detail;
      code = body.detail?.code || body.code || code;
    } catch {
      /* non-JSON error */
    }
    const err = new Error(detail);
    err.code = code;
    throw err;
  }
  return res;
}

export const api = {
  async search(query) {
    const res = await request(`/api/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },
  async resolveStream(videoId, quality = 'best') {
    const res = await request(`/api/stream/${videoId}?quality=${encodeURIComponent(quality)}`);
    return res.json();
  },
  async metadata(videoId) {
    const res = await request(`/api/metadata/${videoId}`);
    return res.json();
  },
  downloadUrl(videoId) {
    return `${API_BASE}/api/download/${videoId}`;
  },
  async health() {
    const res = await request('/api/health');
    return res.json();
  },
};

export default api;
