import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

function getAvatarStorageKey(user) {
  if (!user) return null;
  return `mim_avatar_${user.id || user.email || 'me'}`;
}

function getStoredAvatar(user) {
  const key = getAvatarStorageKey(user);
  if (!key) return null;
  return localStorage.getItem(key);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mim_token'));
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authService.getMe()
        .then(data => {
          const me = data.user;
          setUser(me);
          setProfileImage(getStoredAvatar(me));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('mim_token', data.token);
    localStorage.setItem('mim_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setProfileImage(getStoredAvatar(data.user));
    return data;
  };

  const register = async (formData) => {
    const data = await authService.register(formData);
    localStorage.setItem('mim_token', data.token);
    localStorage.setItem('mim_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setProfileImage(getStoredAvatar(data.user));
    return data;
  };

  const updateProfileImage = (imageData) => {
    if (!user) return;
    const key = getAvatarStorageKey(user);
    if (!key) return;

    if (imageData) {
      localStorage.setItem(key, imageData);
    } else {
      localStorage.removeItem(key);
    }
    setProfileImage(imageData || null);
  };

  const logout = () => {
    localStorage.removeItem('mim_token');
    localStorage.removeItem('mim_user');
    setToken(null);
    setUser(null);
    setProfileImage(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, profileImage, loading, login, register, logout, updateProfileImage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
