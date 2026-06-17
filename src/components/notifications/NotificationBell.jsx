import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../../api/axios.jsx';
import socket from '../../utils/socket.jsx';

const getActorName = (actor) => {
  if (!actor) return '';
  return `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || actor.name || '';
};

const formatNotificationTime = (value) => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return '';

  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m ago`;
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))}h ago`;
  return `${Math.max(1, Math.floor(diff / day))}d ago`;
};

export default function NotificationBell() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const { data } = await api.get('/notifications');
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(Number(data?.unreadCount) || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  // 🔔 Real-time Socket Notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewNotification = () => {
      // Reload notifications when a new one arrives
      loadNotifications();
    };

    const handleNotificationUpdate = (data) => {
      // Real-time notification update
      loadNotifications();
      console.log('📬 Real-time notification:', data);
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:update', handleNotificationUpdate);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:update', handleNotificationUpdate);
    };
  }, [isAuthenticated, loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const markAllRead = async () => {
    try {
      setLoading(true);
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: notification.readAt || new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error('Error marking notifications read:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNotification = async (notification) => {
    try {
      if (!notification.readAt) {
        await api.patch(`/notifications/${notification._id}/read`);
      }

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item
        )
      );
      setUnreadCount((current) => Math.max(0, current - (notification.readAt ? 0 : 1)));
      setOpen(false);

      if (notification.link) {
        navigate(notification.link);
      }
    } catch (error) {
      console.error('Error opening notification:', error);
    }
  };

  return (
    <div ref={panelRef} className="fixed right-4 top-4 z-[120]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-lg transition hover:bg-zinc-50"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-950 shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold">Notifications</h2>
              <p className="text-xs text-zinc-500">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={loading || unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck size={14} />
              Read all
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => {
                const actorName = getActorName(notification.actor);
                const unread = !notification.readAt;

                return (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={`block w-full border-b border-zinc-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-zinc-50 ${
                      unread ? 'bg-blue-50/70' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-950">{notification.title}</p>
                        <p className="mt-1 text-sm leading-5 text-zinc-600">{notification.message}</p>
                        {actorName ? (
                          <p className="mt-2 text-xs font-medium text-zinc-400">From {actorName}</p>
                        ) : null}
                      </div>
                      {unread ? <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" /> : null}
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">{formatNotificationTime(notification.createdAt)}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
