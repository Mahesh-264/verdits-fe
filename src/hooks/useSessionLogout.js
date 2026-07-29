import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { logout as clearSession } from '../redux/authSlice';
import { logoutAccount } from '../api/authApi';
import socket from '../utils/socket.jsx';

export default function useSessionLogout() {
  const dispatch = useDispatch();
  return useCallback(async () => {
    try {
      await logoutAccount();
    } catch (error) {
      console.error('Server logout failed:', error);
    } finally {
      socket.disconnect();
      dispatch(clearSession());
      window.localStorage.setItem('auth:logout', String(Date.now()));
      // Always leave the authenticated route completely. A browser-level
      // replace prevents protected-route or API redirect races from sending
      // the user to the login form instead of the role-selection landing page.
      window.location.replace('/');
    }
  }, [dispatch]);
}
