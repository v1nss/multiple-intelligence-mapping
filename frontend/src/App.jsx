import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';

import AuthLayout from './components/AuthLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Assessment from './pages/Assessment.jsx';
import Results from './pages/Results.jsx';
import ResultsOverview from './pages/ResultsOverview.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminQuestions from './pages/AdminQuestions.jsx';
import AdminAnalytics from './pages/AdminAnalytics.jsx';
import AccountSettings from './pages/AccountSettings.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-gray-500 bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Loading MIM System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Routes>
          {/* Public auth — single shared layout so /login <-> /register transitions smoothly */}
          {user ? (
            <>
              <Route path="/login" element={<Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />} />
              <Route path="/register" element={<Navigate to="/dashboard" />} />
            </>
          ) : (
            <Route element={<AuthLayout />}>
              <Route path="/login" element={null} />
              <Route path="/register" element={null} />
            </Route>
          )}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Student */}
          <Route path="/dashboard" element={<ProtectedRoute requiredRole="student"><Dashboard /></ProtectedRoute>} />
          <Route path="/assessment" element={<ProtectedRoute requiredRole="student"><Assessment /></ProtectedRoute>} />
          <Route path="/assessment/:id" element={<ProtectedRoute requiredRole="student"><Assessment /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute requiredRole="student"><ResultsOverview /></ProtectedRoute>} />
          <Route path="/results/:id" element={<ProtectedRoute requiredRole="student"><Results /></ProtectedRoute>} />
          <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/questions" element={<ProtectedRoute requiredRole="admin"><AdminQuestions /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AdminAnalytics /></ProtectedRoute>} />

          {/* Default */}
          <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
