import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { logout as clearSession } from '../redux/authSlice';
import { logoutAccount } from '../api/authApi';
import socket from '../utils/socket.jsx';
import { getAccessToken } from '../utils/authStorage';

export default function useSessionLogout() {
  const dispatch = useDispatch();

  return useCallback(() => {
    // Start the server-side logout without holding up the visitor's navigation.
    // Preserve the current token for this request because local storage is
    // cleared immediately below.
    const accessToken = getAccessToken();
    void logoutAccount(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined)
      .catch((error) => console.error('Server logout failed:', error));

    socket.disconnect();
    dispatch(clearSession());
    // A logout must not leave role-specific drafts or cached session state behind.
    window.localStorage.setItem('auth:logout', String(Date.now()));
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.location.replace('/role-selection');
  }, [dispatch]);
}
