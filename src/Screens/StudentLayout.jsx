import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Home, LogOut, Search, User, Users } from 'lucide-react';
import { logout, updateUser } from '../redux/authSlice';
import api from '../api/axios.jsx';

const navItems = [
  { label: 'Home', path: '/student-home', Icon: Home },
  { label: 'Profile', path: '/student-profile', Icon: User },
  { label: 'Explore', path: '/student-explore', Icon: Compass },
  { label: 'Network', path: '/student-network', Icon: Users },
];

const getDisplayName = (user) => {
  if (!user) return 'Student';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fullName || user.name || 'Student';
};

export default function StudentLayout({ children }) {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const studentName = getDisplayName(user);

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

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#0b1f44]">
      <header className="sticky top-0 z-30 border-b border-[#dbe2ef] bg-white/95 backdrop-blur">
        <div className="max-w-[1440px] mx-auto px-4 py-4 md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-6 flex-wrap">
              <Link to="/student-home" className="flex items-center gap-3 shrink-0">
                <div className="h-12 w-12 rounded-2xl bg-[#2456f5] text-white flex items-center justify-center font-black text-2xl shadow-sm">
                  N
                </div>
                <span className="text-[18px] md:text-[20px] font-bold text-[#0b1f44]">Nyaayasetu</span>
              </Link>

              <nav className="flex items-center gap-2 overflow-x-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                        isActive
                          ? 'bg-[#eaf1ff] text-[#2456f5]'
                          : 'text-[#44516d] hover:bg-[#f3f6fc] hover:text-[#0b1f44]'
                      }`}
                    >
                      <item.Icon size={20} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-3 w-full xl:w-auto">
              <div className="flex-1 xl:w-[400px]">
                <div className="flex items-center gap-3 rounded-2xl border border-[#dbe2ef] bg-[#fbfcff] px-4 py-3">
                  <Search className="text-[#8a95ab] shrink-0" size={18} />
                  <input
                    type="text"
                    placeholder="Search Nyaayasetu..."
                    className="w-full bg-transparent outline-none text-sm text-[#0b1f44] placeholder:text-[#8a95ab]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/student-profile')}
                className="h-11 w-11 rounded-full bg-[#76b041] text-white font-semibold shrink-0"
              >
                {studentName.charAt(0).toUpperCase()}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0d1024] px-4 py-3 text-sm font-semibold text-white hover:bg-[#171b34] transition"
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
