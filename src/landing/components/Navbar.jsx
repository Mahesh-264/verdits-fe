import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo.jsx';

const navItems = [
  { label: 'Home', path: '/', sectionId: 'home' },
  { label: 'About Us', path: '/about' },
  { label: 'Services', path: '/services' },
  { label: 'How We Work', path: '/#how-we-work', sectionId: 'how-we-work' },
  { label: 'Contact Us', path: '/contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const lastScrollY = useRef(0);
  const activeSection = location.pathname === '/' ? location.hash?.slice(1) || 'home' : location.pathname;

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 24);
      if (currentY <= 8) {
        setVisible(true);
      } else if (currentY > lastScrollY.current) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (item) => {
    setOpen(false);

    if (item.path.startsWith('/#')) {
      const id = item.path.split('#')[1];
      navigate({ pathname: '/', hash: id });
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }

    navigate(item.path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActiveItem = (item) => {
    return location.pathname === '/'
      ? item.path === '/' ? activeSection === 'home' : activeSection === item.sectionId
      : item.path === activeSection;
  };

  const linkClass = (item) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition ${
      isActiveItem(item)
        ? 'border-verdits-navy/20 bg-verdits-teal/10 text-verdits-navy shadow-[0_10px_24px_rgba(76,120,255,0.16)] ring-1 ring-verdits-navy/10'
        : 'border-transparent text-verdits-text hover:border-verdits-line hover:bg-verdits-mint hover:text-verdits-navy'
    }`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'} ${scrolled ? 'py-3' : 'py-5'}`}
    >
      <nav className="section-shell">
        <div
          className={`flex items-center justify-between rounded-2xl border transition-all duration-300 ${
            scrolled
              ? 'border-verdits-line bg-[#fffdf3]/95 px-4 py-3 shadow-xl shadow-black/10 backdrop-blur-xl'
              : 'border-verdits-line bg-[#fffdf3]/85 px-4 py-4 shadow-lg shadow-black/5 backdrop-blur-md'
          }`}
        >
          <Link to="/" className="flex items-center gap-3" aria-label="VERDITS home">
            <BrandLogo className="h-14 sm:h-16" />
          </Link>

          <div className="hidden items-center gap-3 lg:flex">
            {navItems.map((item) => (
              <button key={item.label} type="button" onClick={() => handleNavClick(item)} className={linkClass(item)}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/role-selection"
              className="rounded-full border border-verdits-line bg-white px-5 py-2.5 text-sm font-semibold text-verdits-navy transition hover:border-verdits-teal hover:bg-verdits-mint"
            >
              Login
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-verdits-line bg-white text-verdits-navy lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="mt-3 rounded-2xl border border-verdits-line bg-[#fffdf3]/95 p-3 shadow-2xl shadow-black/10 backdrop-blur-xl lg:hidden">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    isActiveItem(item)
                      ? 'border-verdits-navy/20 bg-verdits-teal/10 text-verdits-navy shadow-sm'
                      : 'border-transparent text-verdits-text hover:border-verdits-line hover:bg-verdits-mint hover:text-verdits-navy'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3">
              <Link
                to="/role-selection"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-verdits-line px-4 py-3 text-center text-sm font-semibold text-verdits-navy"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
