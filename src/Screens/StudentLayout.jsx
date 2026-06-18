import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Home, LogOut, Search, User, Users } from 'lucide-react';
import { logout, updateUser } from '../redux/authSlice';
import api from '../api/axios.jsx';
import BrandLogo from '../components/BrandLogo.jsx';
import NotificationBell from '../components/notifications/NotificationBell.jsx';

const navItems = [
  { label: 'Home', path: '/student-home', Icon: Home },
  { label: 'Profile', path: '/student-profile', Icon: User },
  { label: 'Explore', path: '/student-explore', Icon: Compass },
  { label: 'Network', path: '/student-network', Icon: Users },
];

export default function StudentLayout({ children }) {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login?role=student');
  };

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const profileInitial = (displayName || 'Student').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f3f8fb] text-[#062552]">
      <header className="sticky top-0 z-40 border-b border-[#dbe2ef] bg-white/95 shadow-sm backdrop-blur">
        <div className="max-w-[1440px] mx-auto px-4 py-3 md:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex items-center justify-between gap-4 xl:shrink-0">
              <BrandLogo className="h-10 max-w-[160px]" />

              <div className="flex items-center gap-3 xl:hidden">
                <NotificationBell buttonClassName="border-[#dbe2ef] bg-white text-[#062552] hover:bg-[#f3f8fb]" />
                <button
                  type="button"
                  onClick={() => navigate('/student-profile')}
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#15a276]/20 bg-[#15a276] font-bold text-white shadow-sm transition hover:scale-[1.03]"
                  aria-label="Profile"
                >
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span>{profileInitial}</span>
                  )}
                </button>
              </div>
            </div>

            <nav className="flex items-center gap-2 overflow-x-auto xl:flex-1 xl:justify-center">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;

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
                <button
                  type="button"
                  onClick={() => navigate('/student-profile')}
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#15a276]/20 bg-[#15a276] font-bold text-white shadow-sm transition hover:scale-[1.03]"
                  aria-label="Profile"
                >
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span>{profileInitial}</span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#062552] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0b3b70] transition"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
