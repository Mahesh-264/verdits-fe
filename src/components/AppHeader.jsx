import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BrandLogo from './BrandLogo.jsx';
import NotificationBell from './notifications/NotificationBell.jsx';

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
  children,
}) {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const styles = variantStyles[variant] || variantStyles.user;
  const fallbackInitial = variant === 'lawyer' ? 'L' : variant === 'student' ? 'S' : 'U';
  const dashboardHome = variant === 'lawyer' ? '/lawyer-dash' : variant === 'student' ? '/student-home' : '/user-home';

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
      return;
    }

    if (profileTo) navigate(profileTo);
  };

  return (
    <header className={`sticky top-0 z-40 border-b shadow-sm ${styles.shell}`}>
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center">
          <button
            type="button"
            onClick={() => navigate(dashboardHome)}
            className="shrink-0 cursor-pointer"
            aria-label="Go to dashboard home"
          >
            <BrandLogo className="h-14 max-w-[180px]" light={styles.logoLight} variant="dashboard" />
          </button>
        </div>

        {children ? <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">{children}</div> : null}

        <div className="flex shrink-0 items-center gap-3">
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
        </div>
      </div>
    </header>
  );
}
