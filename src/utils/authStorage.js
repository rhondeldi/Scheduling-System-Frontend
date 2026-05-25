export const AUTH_LOGOUT_EVENT_KEY = "gasss_logout_event";
export const AUTH_LOGIN_EVENT_KEY = "gasss_login_event";

export const clearAuthData = () => {
  localStorage.removeItem("departmentCode");
  localStorage.removeItem("departmentName");
};

export const broadcastLogout = () => {
  localStorage.setItem(AUTH_LOGOUT_EVENT_KEY, `${Date.now()}`);
};

export const broadcastLogin = (accountType) => {
  localStorage.setItem(
    AUTH_LOGIN_EVENT_KEY,
    JSON.stringify({
      accountType,
      timestamp: Date.now(),
    }),
  );
};
