const API_VERSION = "v1";

// this is for development only : start.
const DEV = true;

const defaultBaseUrl = `http://${window.location.hostname}:3000`;
const base_url = import.meta.env.VITE_API_BASE_URL ?? "";

// this is for development only : end.

export { API_VERSION, DEV, base_url };
