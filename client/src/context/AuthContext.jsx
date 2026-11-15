import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [merchant, setMerchant] = useState(() => {
    const saved = localStorage.getItem('loyalty_merchant');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('loyalty_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('loyalty_token');
      if (storedToken) {
        try {
          const res = await api.auth.getProfile();
          if (res.success && res.merchant) {
            setMerchant(res.merchant);
            localStorage.setItem('loyalty_merchant', JSON.stringify(res.merchant));
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setMerchant(res.merchant);
      localStorage.setItem('loyalty_token', res.token);
      localStorage.setItem('loyalty_merchant', JSON.stringify(res.merchant));
    }
    return res;
  };

  const register = async (formData) => {
    const res = await api.auth.register(formData);
    if (res.success && res.token) {
      setToken(res.token);
      setMerchant(res.merchant);
      localStorage.setItem('loyalty_token', res.token);
      localStorage.setItem('loyalty_merchant', JSON.stringify(res.merchant));
    }
    return res;
  };

  const updateMerchant = (updated) => {
    setMerchant(updated);
    localStorage.setItem('loyalty_merchant', JSON.stringify(updated));
  };

  const logout = () => {
    setToken(null);
    setMerchant(null);
    localStorage.removeItem('loyalty_token');
    localStorage.removeItem('loyalty_merchant');
  };

  return (
    <AuthContext.Provider value={{ merchant, token, loading, login, register, logout, updateMerchant }}>
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
