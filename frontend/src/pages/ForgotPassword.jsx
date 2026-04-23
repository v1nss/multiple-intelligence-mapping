import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devLink, setDevLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDevLink('');
    setLoading(true);

    try {
      const data = await authService.forgotPassword(email);
      setSuccess(data.message || 'If an account exists, we sent a reset link.');
      if (data.dev_reset_link) {
        setDevLink(data.dev_reset_link);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Forgot Password</h1>
        <p className="mt-2 text-sm text-gray-600">Enter your account email to receive a reset link.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm font-medium">
              {success}
            </div>
          )}

          {devLink && (
            <div className="bg-blue-50 text-blue-800 border border-blue-200 rounded-lg px-4 py-3 text-sm">
              <p className="font-semibold">Development reset link:</p>
              <a className="underline break-all" href={devLink}>
                {devLink}
              </a>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Email Address"
              required
              className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition"
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-5 text-sm text-gray-600">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-gray-900 underline underline-offset-2 hover:text-gray-700">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
