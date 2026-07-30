const DEFAULT_PORT = 9000;

function getPortFromUrl(url) {
  try {
    const { port } = new URL(url);
    return port || String(DEFAULT_PORT);
  } catch {
    return String(DEFAULT_PORT);
  }
}

export default function getApiUrl() {
  const envUrl = import.meta.env.VITE_API_URL || "";

  // 1. Hash override: #api-10-0-0-5
  if (typeof window !== "undefined") {
    const match = window.location.hash.match(/^#api-(\d+)-(\d+)-(\d+)-(\d+)$/);
    if (match) {
      const octets = [match[1], match[2], match[3], match[4]].map(Number);
      if (!octets.some((o) => isNaN(o) || o < 0 || o > 255)) {
        const port = envUrl ? getPortFromUrl(envUrl) : String(DEFAULT_PORT);
        return `http://${octets.join(".")}:${port}`;
      }
    }
  }

  // 2. Use VITE_API_URL from .env if set
  if (envUrl) return envUrl;

  // 3. Derive from window hostname (useful when testing on any machine)
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:${DEFAULT_PORT}`;
  }

  return `http://localhost:${DEFAULT_PORT}`;
}
