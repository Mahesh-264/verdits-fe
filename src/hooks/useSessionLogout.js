import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout as clearSession } from '../redux/authSlice';
import { logoutAccount } from '../api/authApi';
import { getRefreshToken } from '../utils/authStorage';
import socket from '../utils/socket.jsx';

export default function useSessionLogout(role) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useCallback(async () => {
    try {
      await logoutAccount(getRefreshToken());
    } catch (error) {
      console.error('Server logout failed:', error);
    } finally {
      socket.disconnect();
      dispatch(clearSession());
      // A logout clears both persisted tokens and the Redux user. Landing is
      // now the single signed-out destination; a fresh login is required.
      navigate('/', { replace: true });
    }
  }, [dispatch, navigate, role]);
}
