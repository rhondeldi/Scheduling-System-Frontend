import { DEV, base_url } from "../js/basics.js";

const ADMIN_SESSION_KEY = "gasss_admin_authenticated";

const ADMIN_ALLOWED_PAGES = ["departments", "curriculums", "subjects", "admin-rooms", "admin-instructors"];

export function getAdminAllowedPages() {
  return ADMIN_ALLOWED_PAGES;
}

export function hasAdminSessionHint() {
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function clearAdminSessionHint() {
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export async function isAdminAuthenticated() {
  let apiRequest = "/admin_who";

  if (DEV) {
    apiRequest = `${base_url}/admin_who`;
  }

  try {
    const res = await fetch(apiRequest, {
      credentials: "include",
    });

    if (!res.ok) {
      clearAdminSessionHint();
      return false;
    }

    const text = await res.text();
    const normalizedText = text.trim().toLowerCase();
    const isLoggedOut =
      !normalizedText ||
      normalizedText === "no one is logged in" ||
      normalizedText === "no admin is logged in";

    if (isLoggedOut) {
      clearAdminSessionHint();
      return false;
    }

    window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    return true;
  } catch {
    if (hasAdminSessionHint()) {
      return true;
    }

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

export async function updateAdminAccount({ username, currentPassword, newPassword }) {
  const apiRequest = DEV
    ? `${base_url}/auth_admin_account`
    : "/auth_admin_account";

  const response = await fetch(apiRequest, {
    method: "PATCH",
    credentials: "include",
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username.trim(),
      currentPassword,
      newPassword,
    }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Admin account updates are not available on the running backend. Please restart the backend so the new account settings route is loaded.",
      );
    }

    throw new Error(`${response.status} : ${await response.text()}`);
  }
}

export async function fetchAdminAccount() {
  const apiRequest = DEV
    ? `${base_url}/auth_admin_account`
    : "/auth_admin_account";

  const response = await fetch(apiRequest, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        username: "admin",
        endpointMissing: true,
      };
    }

    throw new Error(`${response.status} : ${await response.text()}`);
  }

  return response.json();
}

export async function logoutAdmin() {
  clearAdminSessionHint();

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
