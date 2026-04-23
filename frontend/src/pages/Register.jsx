import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  SocialButton,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  FacebookIcon,
} from '../components/AuthShared.jsx';

export default function Register() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    gender: '',
    birthdate: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Create an Account</h1>
      <p className="mt-2 text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-gray-900 underline underline-offset-2 hover:text-gray-700"
        >
          Log in
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-semibold text-gray-900 mb-2">
              First Name
            </label>
            <input
              id="first_name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              placeholder="Enter your First Name"
              required
              className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-semibold text-gray-900 mb-2">
              Last Name
            </label>
            <input
              id="last_name"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              placeholder="Enter your Last Name"
              required
              className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your Email Address"
            required
            className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your Password"
              minLength={6}
              required
              className="w-full h-12 px-4 pr-12 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <div className="relative flex items-center py-1">
          <div className="grow border-t border-gray-200" />
          <span className="shrink mx-4 text-xs text-gray-400">or</span>
          <div className="grow border-t border-gray-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SocialButton icon={<GoogleIcon />} label="Continue with Google" />
          <SocialButton icon={<FacebookIcon />} label="Continue with Facebook" />
        </div>
      </form>
    </>
  );
}
