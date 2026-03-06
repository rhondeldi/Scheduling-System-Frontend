import { DEV, base_url } from "../js/basics.js";

const ADMIN_SESSION_KEY = "gasss_admin_authenticated";

const ADMIN_ALLOWED_PAGES = ["departments", "curriculums", "subjects"];

export function getAdminAllowedPages() {
  return ADMIN_ALLOWED_PAGES;
}

export function isAdminAuthenticated() {
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export async function loginAdmin(username, password) {
  let apiRequest = "/auth_admin_login";

  if (DEV) {
    apiRequest = `${base_url}/auth_admin_login`;
  }

  const response = await fetch(apiRequest, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username.trim(),
      password,
    }),
  });

  if (!response.ok) {
    return false;
  }

  window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  return true;
}

export async function logoutAdmin() {
  let apiRequest = "/auth_gasss_logout";

  if (DEV) {
    apiRequest = `${base_url}/auth_gasss_logout`;
  }

  await fetch(apiRequest, {
    method: "DELETE",
    credentials: "include",
  });

  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function isAllowedAdminPage(pageName) {
  return ADMIN_ALLOWED_PAGES.includes(pageName);
}
