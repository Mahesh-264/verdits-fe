import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BrandLogo from './BrandLogo.jsx';
import NotificationBell from './notifications/NotificationBell.jsx';

const variantStyles = {
  user: {
    shell: 'bg-[#062552] text-white border-[#0b3b70]',
    logoLight: true,
    notificationButton: 'border-white/20 bg-white text-[#062552] hover:bg-[#f3f8fb]',
    avatar: 'border-white/25 bg-white text-[#062552]',
  },
  student: {
    shell: 'bg-white text-[#062552] border-[#dbe2ef]',
    logoLight: false,
    notificationButton: 'border-[#dbe2ef] bg-white text-[#062552] hover:bg-[#f3f8fb]',
    avatar: 'border-[#15a276]/20 bg-[#15a276] text-white',
  },
  lawyer: {
    shell: 'bg-zinc-950 text-white border-zinc-800',
    logoLight: true,
    notificationButton: 'border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800',
    avatar: 'border-[#15a276]/50 bg-zinc-900 text-[#15a276]',
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
          <BrandLogo className="h-10 max-w-[160px]" light={styles.logoLight} />
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
