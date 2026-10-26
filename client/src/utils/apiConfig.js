import axios from "axios";
import { io } from "socket.io-client";

// Fallback Render backend link provided for resilient failover
export const FALLBACK_BACKEND_URL = "https://cogniflow-24tj.onrender.com";

const isBrowser = typeof window !== "undefined";
const isLocalhost =
  isBrowser &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

// Determine primary backend URL
const envBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();
export const PRIMARY_BACKEND_URL =
  envBackendUrl || (isLocalhost ? "http://localhost:3000" : FALLBACK_BACKEND_URL);

// Session storage key to persist active backend preference
const STORAGE_KEY = "cogniflow_active_backend";

const getSavedBackend = () => {
  if (!isBrowser) return PRIMARY_BACKEND_URL;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && (saved === PRIMARY_BACKEND_URL || saved === FALLBACK_BACKEND_URL)) {
      return saved;
    }
  } catch (e) {
    // Ignore storage errors
  }
  return PRIMARY_BACKEND_URL;
};

let activeBackendUrl = getSavedBackend();
const listeners = new Set();

/**
 * Returns the currently active backend URL (primary or fallback).
 */
export const getBackendUrl = () => activeBackendUrl;

/**
 * Switches the active backend to the fallback link and persists the selection.
 */
export const switchToFallbackBackend = () => {
  if (activeBackendUrl !== FALLBACK_BACKEND_URL) {
    console.warn(
      `[CogniFlow] Primary backend (${activeBackendUrl}) failed. Seamlessly switching to fallback: ${FALLBACK_BACKEND_URL}`
    );
    activeBackendUrl = FALLBACK_BACKEND_URL;
    if (isBrowser) {
      try {
        sessionStorage.setItem(STORAGE_KEY, FALLBACK_BACKEND_URL);
      } catch (e) {}
      window.dispatchEvent(
        new CustomEvent("cogniflow:backend_changed", {
          detail: { url: FALLBACK_BACKEND_URL },
        })
      );
    }
    listeners.forEach((cb) => {
      try {
        cb(FALLBACK_BACKEND_URL);
      } catch (err) {
        console.error("[CogniFlow] Listener error:", err);
      }
    });
  }
  return activeBackendUrl;
};

/**
 * Subscribe to backend URL changes (e.g. when failover triggers).
 */
export const onBackendUrlChange = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

// Global Axios Request Interceptor:
// If active backend is fallback, rewrite any request pointing to primary backend
axios.interceptors.request.use(
  (config) => {
    if (
      activeBackendUrl === FALLBACK_BACKEND_URL &&
      PRIMARY_BACKEND_URL !== FALLBACK_BACKEND_URL &&
      config.url &&
      config.url.startsWith(PRIMARY_BACKEND_URL)
    ) {
      config.url = config.url.replace(PRIMARY_BACKEND_URL, FALLBACK_BACKEND_URL);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global Axios Response Interceptor:
// Automatically detects network drops / 502 / 503 / 504 errors on primary and retries with fallback
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || config._retryWithFallback) {
      return Promise.reject(error);
    }

    const isNetworkError =
      !error.response ||
      error.code === "ERR_NETWORK" ||
      error.message?.includes("Network Error");
    const isServerError =
      error.response && [500, 502, 503, 504].includes(error.response.status);

    const isPrimaryTarget =
      config.url &&
      (config.url.startsWith(PRIMARY_BACKEND_URL) ||
        (!config.url.startsWith("http") && activeBackendUrl === PRIMARY_BACKEND_URL));

    if (
      (isNetworkError || isServerError) &&
      isPrimaryTarget &&
      PRIMARY_BACKEND_URL !== FALLBACK_BACKEND_URL
    ) {
      config._retryWithFallback = true;
      switchToFallbackBackend();

      if (config.url.startsWith(PRIMARY_BACKEND_URL)) {
        config.url = config.url.replace(PRIMARY_BACKEND_URL, FALLBACK_BACKEND_URL);
      } else if (!config.url.startsWith("http")) {
        config.url = `${FALLBACK_BACKEND_URL}${config.url.startsWith("/") ? "" : "/"}${config.url}`;
      }

      console.info(`[CogniFlow] Retrying request with fallback backend: ${config.url}`);
      return axios(config);
    }

    return Promise.reject(error);
  }
);

/**
 * Creates a Socket.IO connection that automatically fails over to the fallback URL
 * if the primary connection encounters connect errors.
 */
export const createResilientSocket = (options = {}) => {
  let currentTarget = getBackendUrl();
  let socket = io(currentTarget, {
    transports: ["websocket", "polling"],
    timeout: 10000,
    ...options,
  });

  socket.on("connect_error", (err) => {
    console.warn(`[CogniFlow Socket] Connect error on ${currentTarget}:`, err.message);
    if (currentTarget !== FALLBACK_BACKEND_URL) {
      switchToFallbackBackend();
      currentTarget = FALLBACK_BACKEND_URL;
      socket.disconnect();
      socket.io.uri = FALLBACK_BACKEND_URL;
      socket.connect();
    }
  });

  return socket;
};

// Initial lightweight health check if on remote host and primary is not fallback
if (isBrowser && !isLocalhost && PRIMARY_BACKEND_URL !== FALLBACK_BACKEND_URL) {
  setTimeout(() => {
    if (activeBackendUrl === PRIMARY_BACKEND_URL) {
      fetch(`${PRIMARY_BACKEND_URL}/api/auth/health`, {
        method: "GET",
        mode: "cors",
      }).catch(() => {
        // If primary is unresponsive, silently switch to fallback
        switchToFallbackBackend();
      });
    }
  }, 1000);
}
