import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, Compass, Home, LogOut, Search, User, Users } from 'lucide-react';
import { updateUser } from '../redux/authSlice';
import api from '../api/axios.jsx';
import BrandLogo from '../components/BrandLogo.jsx';
import NotificationBell from '../components/notifications/NotificationBell.jsx';
import useSessionLogout from '../hooks/useSessionLogout.js';

const navItems = [
  { label: 'Home', path: '/student-home', Icon: Home },
  { label: 'Explore', path: '/student-explore', Icon: Compass },
  { label: 'Network', path: '/student-network', Icon: Users },
  { label: 'Your Applications', path: '/student-applications', Icon: Briefcase },
];

export default function StudentLayout({ children }) {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const mobileProfileRef = React.useRef(null);
  const desktopProfileRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideMobile = mobileProfileRef.current && mobileProfileRef.current.contains(event.target);
      const isInsideDesktop = desktopProfileRef.current && desktopProfileRef.current.contains(event.target);
      if (!isInsideMobile && !isInsideDesktop) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    const syncStudent = async () => {
      try {
        const { data } = await api.get('/auth/me');
        dispatch(updateUser(data));
      } catch (error) {
        console.error('Error syncing current user:', error);
      }
    };

    if (user?.role === 'student') {
      syncStudent();
    }
  }, [dispatch, user?.role]);

  const handleLogout = useSessionLogout('student');

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const profileInitial = (displayName || 'Student').charAt(0).toUpperCase();
  const locationLabel = user?.address?.city || user?.address?.district || user?.address?.state || '';

  const profileMenu = (
    <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-[#d7e9ef] bg-white p-4 text-[#062552] shadow-2xl shadow-[#062552]/15">
      <div className="flex items-start gap-3 border-b border-[#e6eef2] pb-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#15a276]/20 bg-[#15a276] font-bold text-white">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span>{profileInitial}</span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">{displayName || 'Student'}</h3>
          <p className="text-xs font-bold uppercase tracking-wide text-[#15a276]">Student</p>
          <p className="mt-1 truncate text-xs text-[#5f7488]">
            {user?.studentProfile?.collegeName || 'Student profile'}
          </p>
        </div>
      </div>

      <div className="space-y-2 py-4 text-sm text-[#43556a]">
        {user?.email ? <p className="truncate">{user.email}</p> : null}
        {user?.phone ? <p>{user.phone}</p> : null}
        {locationLabel ? <p className="truncate">{locationLabel}</p> : null}
        <p className="text-xs font-semibold text-[#5f7488]">
          Year: <span className="text-[#062552]">{user?.studentProfile?.currentYear || 'Not added'}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setShowProfileMenu(false);
            navigate('/student-profile');
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d7e9ef] bg-[#f7fbfc] px-3 py-2 text-sm font-bold text-[#062552] transition hover:border-[#15a276]"
        >
          <User size={16} />
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
  );

  return (
    <div className="min-h-screen bg-[#f3f8fb] text-[#062552]">
      <header className="sticky top-0 z-40 border-b border-[#dbe2ef] bg-white/95 shadow-sm backdrop-blur">
        <div className="max-w-[1440px] mx-auto px-4 py-3 md:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex items-center justify-between gap-4 xl:shrink-0">
              <Link to="/student-home" className="shrink-0" aria-label="Go to dashboard home">
                <BrandLogo className="h-16" showWordmark />
              </Link>

              <div className="flex items-center gap-3 xl:hidden">
                <NotificationBell buttonClassName="border-[#dbe2ef] bg-white text-[#062552] hover:bg-[#f3f8fb]" />
                <div ref={mobileProfileRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowProfileMenu((current) => !current)}
                    className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#15a276]/20 bg-[#15a276] font-bold text-white shadow-sm transition hover:scale-[1.03]"
                    aria-label="Profile"
                  >
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span>{profileInitial}</span>
                    )}
                  </button>
                  {showProfileMenu ? profileMenu : null}
                </div>
              </div>
            </div>

            <nav className="flex items-center gap-2 overflow-x-auto xl:flex-1 xl:justify-center">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                      isActive
                        ? 'bg-[#e8f7f2] text-[#15a276]'
                        : 'text-[#44516d] hover:bg-[#f3f8fb] hover:text-[#062552]'
                    }`}
                  >
                    <item.Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 w-full xl:w-auto xl:shrink-0">
              <div className="flex-1 xl:w-[400px]">
                <div className="flex items-center gap-3 rounded-2xl border border-[#dbe2ef] bg-[#fbfcff] px-4 py-3">
                  <Search className="text-[#8a95ab] shrink-0" size={18} />
                  <input
                    type="text"
                    placeholder="Search VERDITS..."
                    className="w-full bg-transparent outline-none text-sm text-[#062552] placeholder:text-[#8a95ab]"
                  />
                </div>
              </div>

              <div className="hidden items-center gap-3 xl:flex">
                <NotificationBell buttonClassName="border-[#dbe2ef] bg-white text-[#062552] hover:bg-[#f3f8fb]" />
                <div ref={desktopProfileRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowProfileMenu((current) => !current)}
                    className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#15a276]/20 bg-[#15a276] font-bold text-white shadow-sm transition hover:scale-[1.03]"
                    aria-label="Profile"
                  >
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span>{profileInitial}</span>
                    )}
                  </button>
                  {showProfileMenu ? profileMenu : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-[1440px] px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
