import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, LogOut, Mail, MapPin, Phone, UserCircle } from 'lucide-react';
import BrandLogo from './BrandLogo.jsx';
import NotificationBell from './notifications/NotificationBell.jsx';
import useSessionLogout from '../hooks/useSessionLogout.js';

const variantStyles = {
  user: {
    shell: 'bg-[#f8f3e3]/95 text-[#0d1117] border-[#d6b85b]/45 backdrop-blur',
    logoLight: false,
    notificationButton: 'border-[#d6b85b]/45 bg-white text-[#0d1117] hover:bg-[#fff2bf]',
    avatar: 'border-[#f1d15f]/45 bg-[#f1d15f] text-[#0d1117]',
  },
  student: {
    shell: 'bg-[#f8f3e3]/95 text-[#0d1117] border-[#d6b85b]/45 backdrop-blur',
    logoLight: false,
    notificationButton: 'border-[#d6b85b]/45 bg-white text-[#0d1117] hover:bg-[#fff2bf]',
    avatar: 'border-[#f1d15f]/45 bg-[#f1d15f] text-[#0d1117]',
  },
  lawyer: {
    shell: 'bg-[#f8f3e3]/95 text-[#0d1117] border-[#d6b85b]/45 backdrop-blur',
    logoLight: false,
    notificationButton: 'border-[#d6b85b]/45 bg-white text-[#0d1117] hover:bg-[#fff2bf]',
    avatar: 'border-[#f1d15f]/45 bg-[#f1d15f] text-[#0d1117]',
  },
};

const getInitial = (user, fallback) => {
  const name = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  return (name || fallback).charAt(0).toUpperCase();
};

export default function AppHeader({
  variant = 'user',
  profileTo,
  onProfileClick,
  showBrandName = true,
  showBackButton = false,
  backTo,
  children,
}) {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const profileContainerRef = React.useRef(null);
  const styles = variantStyles[variant] || variantStyles.user;
  const fallbackInitial = variant === 'lawyer' ? 'L' : variant === 'student' ? 'S' : 'U';
  const dashboardHome = variant === 'lawyer' ? '/lawyer-dash' : variant === 'student' ? '/student-home' : '/user-home';
  const handleLogout = useSessionLogout(user?.role || variant);
  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Profile';
  const roleLabel = user?.role || variant;
  const locationLabel = user?.address?.city || user?.address?.district || user?.address?.state || '';

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileContainerRef.current && !profileContainerRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setShowProfileMenu((current) => !current);
  };

  const handleViewProfile = () => {
    setShowProfileMenu(false);

    if (onProfileClick) {
      onProfileClick();
      return;
    }

    navigate(profileTo || (variant === 'student' ? '/student-profile' : '/profile'));
  };

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
      return;
    }

    navigate(-1);
  };

  return (
    <header className={`sticky top-0 z-40 border-b shadow-sm ${styles.shell}`}>
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {showBackButton ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d6b85b]/45 bg-white text-[#0d1117] transition hover:bg-[#fff2bf]"
              aria-label="Go back"
            >
              <ArrowLeft size={19} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => navigate(dashboardHome)}
            className="shrink-0 cursor-pointer"
            aria-label="Go to dashboard home"
          >
            <BrandLogo className="h-16" light={styles.logoLight} showWordmark={showBrandName} />
          </button>
        </div>

        {children ? <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">{children}</div> : null}

        <div ref={profileContainerRef} className="relative flex shrink-0 items-center gap-3">
          <NotificationBell buttonClassName={styles.notificationButton} />
          <button
            type="button"
            onClick={handleProfileClick}
            className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border font-bold shadow-sm transition hover:scale-[1.03] ${styles.avatar}`}
            aria-label="Profile"
          >
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span>{getInitial(user, fallbackInitial)}</span>
            )}
          </button>

          {showProfileMenu ? (
            <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-[#d7e9ef] bg-white p-4 text-[#062552] shadow-2xl shadow-[#062552]/15">
              <div className="flex items-start gap-3 border-b border-[#e6eef2] pb-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border font-bold ${styles.avatar}`}>
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span>{getInitial(user, fallbackInitial)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold">{displayName}</h3>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#15a276]">{roleLabel}</p>
                  {variant === 'lawyer' ? (
                    <p className="mt-1 truncate text-xs text-[#5f7488]">
                      {user?.lawyerProfile?.specialization || 'Legal Services'}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2 py-4 text-sm text-[#43556a]">
                {user?.email ? (
                  <p className="flex items-center gap-2">
                    <Mail size={15} className="text-[#15a276]" />
                    <span className="truncate">{user.email}</span>
                  </p>
                ) : null}
                {user?.phone ? (
                  <p className="flex items-center gap-2">
                    <Phone size={15} className="text-[#15a276]" />
                    <span>{user.phone}</span>
                  </p>
                ) : null}
                {locationLabel ? (
                  <p className="flex items-center gap-2">
                    <MapPin size={15} className="text-[#15a276]" />
                    <span className="truncate">{locationLabel}</span>
                  </p>
                ) : null}
                {variant === 'lawyer' ? (
                  <p className="text-xs font-semibold text-[#5f7488]">
                    Bar Council ID: <span className="text-[#062552]">{user?.lawyerProfile?.barId || 'Not provided'}</span>
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleViewProfile}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d7e9ef] bg-[#f7fbfc] px-3 py-2 text-sm font-bold text-[#062552] transition hover:border-[#15a276]"
                >
                  <UserCircle size={16} />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition-all hover:bg-red-600 hover:text-white hover:border-red-600 select-none touch-manipulation active:scale-[0.98]"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
