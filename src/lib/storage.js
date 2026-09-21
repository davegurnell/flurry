// localStorage can be missing or throw (private windows, blocked site data).

export function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const KEYS = { doc: "lfts-doc", library: "lfts-library", bg: "lfts-bg" };
