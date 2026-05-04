import { DEV, base_url } from "../js/basics.js";

const ADMIN_SESSION_KEY = "gasss_admin_authenticated";

const ADMIN_ALLOWED_PAGES = ["departments", "curriculums", "subjects"];

export function getAdminAllowedPages() {
  return ADMIN_ALLOWED_PAGES;
}

export async function isAdminAuthenticated() {
  if (window.sessionStorage.getItem(ADMIN_SESSION_KEY) !== "true") {
    return false;
  }

  let apiRequest = "/admin_who";

  if (DEV) {
    apiRequest = `${base_url}/admin_who`;
  }

  try {
    const res = await fetch(apiRequest, {
      credentials: "include",
    });

    if (!res.ok) {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return false;
    }

    const text = await res.text();
    const isLoggedOut =
      !text || text.trim().toLowerCase() === "no one is logged in";

    if (isLoggedOut) {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return false;
    }

    return true;
  } catch {
    return false;
  }
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
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);

  const logoutPaths = ["/auth_admin_logout", "/auth_gasss_logout"];

  for (const logoutPath of logoutPaths) {
    const apiRequest = DEV ? `${base_url}${logoutPath}` : logoutPath;

    const response = await fetch(apiRequest, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.ok) {
      return;
    }
  }
}

export function isAllowedAdminPage(pageName) {
  return ADMIN_ALLOWED_PAGES.includes(pageName);
}
