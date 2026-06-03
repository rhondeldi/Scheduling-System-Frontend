const API_VERSION = "v1";

// this is for development only : start.
// DEV is true under `npm run dev` (Vite dev server) and false under `npm run build`,
// so production builds use same-origin relative paths instead of http://host:3000.
const DEV = import.meta.env.DEV;

const defaultBaseUrl = `http://${window.location.hostname}:3000`;
const base_url = import.meta.env.VITE_API_BASE_URL ?? defaultBaseUrl;

// this is for development only : end.

export { API_VERSION, DEV, base_url };
