import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authService.getToken();
      if (storedToken) {
        try {
          const data = await authService.getMe();
          if (data.user) {
            setUser(data.user);
          }
        } catch (err) {
          console.error('Session restore failed:', err.message);
          authService.logout();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      setToken(data.token);
      showSuccess(`Welcome back, ${data.user.name}!`);
      return { success: true };
    } catch (err) {
      showError(err.message);
      return { success: false, error: err.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await authService.register(name, email, password);
      setUser(data.user);
      setToken(data.token);
      showSuccess('Account created successfully! Welcome to Secure File Hub.');
      return { success: true };
    } catch (err) {
      showError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    showSuccess('You have been logged out.');
  };

  const updateProfile = async (profileData) => {
    try {
      const data = await authService.updateProfile(profileData);
      setUser(data.user);
      showSuccess('Profile updated successfully.');
      return { success: true };
    } catch (err) {
      showError(err.message);
      return { success: false, error: err.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      showSuccess('Password updated successfully.');
      return { success: true };
    } catch (err) {
      showError(err.message);
      return { success: false, error: err.message };
    }
  };

  const refreshUser = async () => {
    try {
      const data = await authService.getMe();
      if (data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.error('Refresh user error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
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
