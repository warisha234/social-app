const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

// Turns a backend-relative path like "/uploads/xyz.jpg" into a full URL
// pointing at the backend server. Absolute URLs (http/https) and empty
// values pass through unchanged.
export function mediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}
