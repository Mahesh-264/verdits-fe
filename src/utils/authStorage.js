const AUTH_KEYS = ['user', 'accessToken', 'refreshToken'];
const PERSISTENCE_KEY = 'authPersistence';

const safeRead = (storage, key) => {
  try {
    return storage?.getItem(key) || null;
  } catch (error) {
    console.error(`Error reading ${key} from storage`, error);
    return null;
  }
};

const safeWrite = (storage, key, value) => {
  try {
    storage?.setItem(key, value);
  } catch (error) {
    console.error(`Error writing ${key} to storage`, error);
  }
};

const safeRemove = (storage, key) => {
  try {
    storage?.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage`, error);
  }
};

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return safeRead(window.localStorage, PERSISTENCE_KEY) === 'local'
    ? window.localStorage
    : window.sessionStorage;
};

export const setAuthPersistence = (remember) => {
  if (typeof window === 'undefined') return;

  const target = remember ? window.localStorage : window.sessionStorage;
  const previous = remember ? window.sessionStorage : window.localStorage;

  AUTH_KEYS.forEach((key) => {
    const value = safeRead(previous, key);
    if (value && !safeRead(target, key)) safeWrite(target, key, value);
    safeRemove(previous, key);
  });

  if (remember) {
    safeWrite(window.localStorage, PERSISTENCE_KEY, 'local');
  } else {
    safeRemove(window.localStorage, PERSISTENCE_KEY);
  }
};

export const migrateLegacyAuthStorage = () => {
  if (typeof window === 'undefined') return;
  if (safeRead(window.localStorage, PERSISTENCE_KEY) === 'local') return;

  AUTH_KEYS.forEach((key) => {
    const sessionValue = safeRead(window.sessionStorage, key);
    const localValue = safeRead(window.localStorage, key);
    if (!sessionValue && localValue) safeWrite(window.sessionStorage, key, localValue);
    if (localValue) safeRemove(window.localStorage, key);
  });
};

export const getStoredUser = () => {
  const storage = getStorage();
  const rawUser = safeRead(storage, 'user');
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    console.error('Error parsing user from storage', error);
    safeRemove(storage, 'user');
    return null;
  }
};

export const setStoredUser = (user) => {
  safeWrite(getStorage(), 'user', JSON.stringify(user));
};

export const getAccessToken = () => safeRead(getStorage(), 'accessToken');

export const setAccessToken = (token) => {
  if (!token) safeRemove(getStorage(), 'accessToken');
  else safeWrite(getStorage(), 'accessToken', token);
};

export const getRefreshToken = () => safeRead(getStorage(), 'refreshToken');

export const setRefreshToken = (token) => {
  if (!token) safeRemove(getStorage(), 'refreshToken');
  else safeWrite(getStorage(), 'refreshToken', token);
};

export const storeAuthSession = (session, remember = false) => {
  setAuthPersistence(remember);
  setAccessToken(session.accessToken);
  // The refresh token is delivered as an HttpOnly cookie by the API. Never
  // persist it in JavaScript-readable storage where an XSS bug could exfiltrate it.
  setRefreshToken(null);
};

export const clearAuthStorage = () => {
  if (typeof window === 'undefined') return;
  AUTH_KEYS.forEach((key) => {
    safeRemove(window.sessionStorage, key);
    safeRemove(window.localStorage, key);
  });
  safeRemove(window.localStorage, PERSISTENCE_KEY);
};
