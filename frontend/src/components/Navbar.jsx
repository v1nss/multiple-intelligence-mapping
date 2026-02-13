import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-gray-200 shadow-sm">
      <Link to="/" className="flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors">
        <span className="text-2xl">🧠</span>
        <span>MIM System</span>
      </Link>

      <div className="hidden md:flex items-center gap-1">
        {user.role === 'student' && (
          <>
            <Link to="/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-all">Dashboard</Link>
            <Link to="/assessment" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-all">Assessment</Link>
            <Link to="/profile" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-all">Profile</Link>
          </>
        )}
        {user.role === 'admin' && (
          <>
            <Link to="/admin" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-all">Dashboard</Link>
            <Link to="/admin/questions" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-all">Questions</Link>
            <Link to="/admin/analytics" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-all">Analytics</Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-sm font-semibold text-gray-700">{user.first_name} {user.last_name}</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
        <button onClick={handleLogout} className="px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-all">
          Logout
        </button>
      </div>
    </nav>
  );
}
