export const config = {
  // In production, default to using the same origin via Nginx proxy (/api)
  API_URL:
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api'),
};
