import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path === '/assessment' && location.pathname.startsWith('/assessment')) return true;
    if (path === '/results' && location.pathname.startsWith('/results')) return true;
    if (path === '/profile' && location.pathname === '/profile') return true;
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path === '/admin/questions' && location.pathname === '/admin/questions') return true;
    if (path === '/admin/analytics' && location.pathname === '/admin/analytics') return true;
    return false;
  };

  const linkClass = (path) =>
    `px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
      isActive(path)
        ? 'border border-blue-600 text-blue-600 bg-blue-50/50'
        : 'text-gray-500 hover:text-blue-600'
    }`;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-gray-200 shadow-sm">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
          <span className="text-white text-xs font-bold">MI</span>
        </div>
        <span className="hidden sm:inline">MIM System</span>
      </Link>

      {/* Center Nav Links */}
      <div className="hidden md:flex items-center gap-2">
        {user.role === 'student' && (
          <>
            <Link to="/dashboard" className={linkClass('/dashboard')}>Dashboard</Link>
            <Link to="/assessment" className={linkClass('/assessment')}>Assessment</Link>
            <Link to="/profile" className={linkClass('/profile')}>Profile</Link>
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
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{user.first_name} {user.last_name}</p>
            <p className="text-[10px] text-gray-400 leading-tight">{user.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-red-500 transition-all ml-1">
          Logout
        </button>
      </div>
    </nav>
  );
}
