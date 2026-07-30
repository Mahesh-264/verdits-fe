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

const resolveNotificationLink = (notification, user) => {
  const metadata = notification?.metadata || {};
  const actorId = notification?.actor?._id || notification?.actor?.id || notification?.actor;
  const userRole = user?.role;

  if (notification?.type === 'new_message') {
    const partnerId = metadata.senderId || actorId;
    return partnerId ? `/chat?partnerId=${partnerId}` : '/chat';
  }

  if (notification?.type === 'student_connection_request' || notification?.type === 'student_connection_accepted') {
    return '/student-network?tab=students';
  }

  if (notification?.type === 'follow_accepted') {
    return userRole === 'student' ? '/student-network?tab=lawyers' : '/lawyer-dash?section=student-interactions&tab=posts';
  }

  if (notification?.type === 'appointment_request') {
    return `/lawyer-dash?section=appointments${metadata.appointmentId ? `&appointmentId=${metadata.appointmentId}` : ''}`;
  }

  if (notification?.type === 'appointment_accepted' || notification?.type === 'appointment_rejected') {
    return metadata.lawyerId ? `/lawyer-profile/${metadata.lawyerId}` : (notification?.link || '/user-home');
  }

  if (notification?.type === 'internship_application') {
    return `/lawyer-dash?section=student-interactions&tab=internships${metadata.internshipId ? `&itemId=${metadata.internshipId}` : ''}`;
  }

  if (notification?.type === 'internship_application_update') {
    return `/student-explore?tab=internships${metadata.internshipId ? `&itemId=${metadata.internshipId}` : ''}`;
  }

  if (notification?.type === 'jam_session_joined') {
    return `/lawyer-dash?section=student-interactions&tab=jamSessions${metadata.sessionId ? `&itemId=${metadata.sessionId}` : ''}`;
  }

  if (
    notification?.type === 'team_join_request'
    || notification?.type === 'team_join_accepted'
    || notification?.type === 'team_join_rejected'
    || notification?.type === 'team_member_removed'
  ) {
    return '/lawyer-dash?section=team';
  }

  if (notification?.type === 'new_post') {
    if (metadata.internshipId) {
      return `/student-explore?tab=internships&itemId=${metadata.internshipId}`;
    }

    if (metadata.sessionId) {
      return `/student-explore?tab=jamSessions&itemId=${metadata.sessionId}`;
    }

    if (metadata.postId) {
      return userRole === 'lawyer'
        ? `/lawyer-dash?section=student-interactions&tab=posts&postId=${metadata.postId}`
        : `/student-home?postId=${metadata.postId}`;
    }
  }

  if (notification?.type === 'post_liked' || notification?.type === 'post_commented') {
    if (metadata.internshipId) {
      return `/lawyer-dash?section=student-interactions&tab=internships&itemId=${metadata.internshipId}`;
    }

    if (metadata.sessionId) {
      return `/lawyer-dash?section=student-interactions&tab=jamSessions&itemId=${metadata.sessionId}`;
    }

    if (metadata.postId) {
      return userRole === 'student'
        ? `/student-home?postId=${metadata.postId}`
        : `/lawyer-dash?section=student-interactions&tab=posts&postId=${metadata.postId}`;
    }
  }

  if (notification?.link === '/student-dash') return '/student-home';
  if (notification?.link?.startsWith('/profile/')) return '/student-home';

  return notification?.link || '/dashboard';
};

export default function NotificationBell({ className = '', buttonClassName = '', panelClassName = '' }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
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

    const handleNewNotification = (notification) => {
      // The server sends the saved notification. Add it immediately so the
      // badge and panel update even when the next HTTP refresh is delayed.
      if (notification?._id) {
        setNotifications((current) => [
          notification,
          ...current.filter((item) => item._id !== notification._id),
        ]);
        if (!notification.readAt) setUnreadCount((current) => current + 1);
      } else {
        loadNotifications();
      }
    };

    const handleNotificationUpdate = () => {
      // Real-time notification update
      loadNotifications();
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
    const wasUnread = !notification.readAt;

    setNotifications((current) =>
      current.map((item) =>
        item._id === notification._id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item
      )
    );
    if (wasUnread) setUnreadCount((current) => Math.max(0, current - 1));
    setOpen(false);

    try {
      if (wasUnread) {
        await api.patch(`/notifications/${notification._id}/read`);
      }
    } catch (error) {
      console.error('Error opening notification:', error);
    }

    // Opening a notification should still take the user to its destination if
    // marking it read briefly fails.
    navigate(resolveNotificationLink(notification, user));
  };

  return (
    <div ref={panelRef} className={`relative z-[120] ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 shadow-lg transition hover:bg-zinc-50 ${buttonClassName}`}
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
        <div className={`absolute right-0 top-full mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-950 shadow-2xl ${panelClassName}`}>
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
                      {unread ? <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#15a276]" /> : null}
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
