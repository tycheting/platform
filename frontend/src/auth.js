// src/auth.js
const TOKEN_KEY = "token";
const USERNAME_KEY = "userName";
const EXP_KEY = "tokenExp"; // 毫秒時間戳

let logoutTimerId = null;

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

// JWT 是 base64url，需轉換後再解碼
function base64UrlDecode(str) {
  try {
    const pad = (s) => s + "=".repeat((4 - (s.length % 4)) % 4);
    const base64 = pad(str.replace(/-/g, "+").replace(/_/g, "/"));
    return atob(base64);
  } catch {
    return "";
  }
}

function decodePayload(token) {
  try {
    const part = token.split(".")[1] || "";
    const json = base64UrlDecode(part);
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
}

export function saveAuth(token) {
  localStorage.setItem(TOKEN_KEY, token);

  const payload = decodePayload(token);
  const name = payload?.name || "";
  const expMs = isFiniteNumber(payload?.exp) ? payload.exp * 1000 : 0; // 秒→毫秒

  localStorage.setItem(USERNAME_KEY, name);
  localStorage.setItem(EXP_KEY, String(expMs || 0));

  scheduleAutoLogout();
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getTokenExp() {
  const v = localStorage.getItem(EXP_KEY);
  const n = v ? parseInt(v, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function isTokenExpired() {
  const token = getToken();
  const exp = getTokenExp();
  if (!token || !exp) return true;
  return Date.now() >= exp;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXP_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function logout(options = {}) {
  // options.redirect === false 時，不導頁
  clearAuth();

  if (options.redirect === false) return;

  // 避免在 /login 再次 replace 造成重整閃爍
  try {
    const path = window?.location?.pathname || "";
    if (path !== "/login") {
      window.location.replace("/login");
    }
  } catch {
    // ignore
  }
}

export function scheduleAutoLogout() {
  if (logoutTimerId) clearTimeout(logoutTimerId);

  const exp = getTokenExp(); // 毫秒
  if (!isFiniteNumber(exp) || exp <= 0) return;

  const now = Date.now();
  const delay = exp - now;

  // exp 無效、已到期、或只剩極短時間 -> 不排計時器（交由受保護頁的檢查邏輯處理）
  if (delay <= 1000) return;

  logoutTimerId = setTimeout(() => logout(), delay);
}
