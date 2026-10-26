/**
 * Resilient multi-tab authentication storage.
 * Prioritizes sessionStorage (isolated per tab) so two tabs can log into different accounts (Demo1, Demo2)
 * without overwriting each other, while falling back to localStorage for single-tab persistence.
 */

export const getAuthToken = () => {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("token") || localStorage.getItem("token") || "";
};

export const getAuthUserId = () => {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("userid") || localStorage.getItem("userid") || "";
};

export const setAuthSession = (token, userid) => {
  if (typeof window === "undefined") return;
  if (token) {
    sessionStorage.setItem("token", token);
    localStorage.setItem("token", token);
  }
  if (userid) {
    sessionStorage.setItem("userid", userid);
    localStorage.setItem("userid", userid);
  }
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("userid");
  localStorage.removeItem("token");
  localStorage.removeItem("userid");
};
