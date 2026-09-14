import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fintrack_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('fintrack_token');
      if (storedToken) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
          localStorage.setItem('fintrack_user', JSON.stringify(profile));
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    localStorage.setItem('fintrack_token', data.access_token);
    setToken(data.access_token);
    const userInfo = { id: data.user_id, name: data.name, email: data.email };
    setUser(userInfo);
    localStorage.setItem('fintrack_user', JSON.stringify(userInfo));
    return data;
  };

  const verifyOtp = async (email, otpCode) => {
    const data = await authService.verifyOtp(email, otpCode);
    localStorage.setItem('fintrack_token', data.access_token);
    setToken(data.access_token);
    const userInfo = { id: data.user_id, name: data.name, email: data.email };
    setUser(userInfo);
    localStorage.setItem('fintrack_user', JSON.stringify(userInfo));
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    localStorage.setItem('fintrack_token', data.access_token);
    setToken(data.access_token);
    const userInfo = { id: data.user_id, name: data.name, email: data.email };
    setUser(userInfo);
    localStorage.setItem('fintrack_user', JSON.stringify(userInfo));
    return data;
  };

  const logout = () => {
    localStorage.removeItem('fintrack_token');
    localStorage.removeItem('fintrack_user');
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('fintrack_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!token, login, verifyOtp, register, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
