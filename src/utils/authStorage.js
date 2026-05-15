const AUTH_KEYS = ['user', 'accessToken', 'refreshToken'];

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
};

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
    if (!storage) return;
    storage.setItem(key, value);
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

export const migrateLegacyAuthStorage = () => {
  if (typeof window === 'undefined') return;

  const session = window.sessionStorage;
  const local = window.localStorage;

  AUTH_KEYS.forEach((key) => {
    const sessionValue = safeRead(session, key);
    const localValue = safeRead(local, key);

    if (!sessionValue && localValue) {
      safeWrite(session, key, localValue);
    }

    if (localValue) {
      safeRemove(local, key);
    }
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
  const storage = getStorage();
  safeWrite(storage, 'user', JSON.stringify(user));
};

export const getAccessToken = () => safeRead(getStorage(), 'accessToken');

export const setAccessToken = (token) => {
  const storage = getStorage();
  if (!token) {
    safeRemove(storage, 'accessToken');
    return;
  }
  safeWrite(storage, 'accessToken', token);
};

export const getRefreshToken = () => safeRead(getStorage(), 'refreshToken');

export const setRefreshToken = (token) => {
  const storage = getStorage();
  if (!token) {
    safeRemove(storage, 'refreshToken');
    return;
  }
  safeWrite(storage, 'refreshToken', token);
};

export const clearAuthStorage = () => {
  const storage = getStorage();
  AUTH_KEYS.forEach((key) => safeRemove(storage, key));
};
