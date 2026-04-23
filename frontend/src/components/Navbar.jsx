import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, profileImage, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const handleProfileNavigation = () => {
    setIsProfileMenuOpen(false);
    navigate('/account-settings');
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (!user) return null;

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path === '/assessment' && location.pathname.startsWith('/assessment')) return true;
    if (path === '/results' && location.pathname.startsWith('/results')) return true;
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path === '/admin/questions' && location.pathname === '/admin/questions') return true;
    if (path === '/admin/analytics' && location.pathname === '/admin/analytics') return true;
    return false;
  };

  const linkClass = (path) =>
    `px-6 py-2 rounded-full text-sm transition-colors ${
      isActive(path)
        ? 'bg-white text-blue-600 font-bold shadow-sm'
        : 'text-gray-500 font-medium hover:text-gray-700'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">
      {/* Logo */}
      <Link to="/" className="flex shrink-0 items-center gap-2.5 text-sm font-semibold text-gray-800 transition-colors hover:text-gray-600">
        <img
          src="/mimlogo.png"
          alt="MIM Logo"
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="hidden sm:inline uppercase tracking-wide">MIM System</span>
      </Link>

      {/* Center Nav Links */}
      <div className="hidden items-center rounded-full bg-gray-100 p-1 md:flex">
        {user.role === 'student' && (
          <>
            <Link to="/dashboard" className={linkClass('/dashboard')}>Dashboard</Link>
            <Link to="/assessment" className={linkClass('/assessment')}>Assessment</Link>
            <Link to="/results" className={linkClass('/results')}>Results</Link>
          </>
        )}
        {user.role === 'admin' && (
          <>
            <Link to="/admin" className={linkClass('/admin')}>Dashboard</Link>
            <Link to="/admin/questions" className={linkClass('/admin/questions')}>Questions</Link>
            <Link to="/admin/analytics" className={linkClass('/admin/analytics')}>Analytics</Link>
          </>
        )}
      </div>

      {/* Right: User Info */}
      <div className="relative flex items-center gap-3" ref={profileMenuRef}>
        <button
          type="button"
          onClick={() => setIsProfileMenuOpen((prev) => !prev)}
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-gray-100"
          aria-label="Open profile menu"
          aria-haspopup="menu"
          aria-expanded={isProfileMenuOpen}
        >
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-900 text-[10px] font-bold text-white">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span>{user.first_name?.[0]}{user.last_name?.[0]}</span>
            )}
          </div>
          <div className="hidden sm:flex sm:flex-col sm:items-start text-left">
            <p className="text-sm font-semibold leading-tight text-gray-800">{user.first_name} {user.last_name}</p>
            <p className="text-[10px] leading-tight text-gray-400">{user.email}</p>
          </div>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`hidden h-4 w-4 text-gray-400 transition-transform sm:block ${isProfileMenuOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {isProfileMenuOpen && (
          <div
            className="absolute right-0 top-12 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg"
            role="menu"
            aria-label="Profile menu"
          >
            <button
              type="button"
              onClick={handleProfileNavigation}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              role="menuitem"
            >
              View Account Settings
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              role="menuitem"
            >
              Logout
            </button>
          </div>
        )}
      </div>
      </div>
    </nav>
  );
}
