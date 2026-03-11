import React, { createContext, useState, useContext, useEffect } from 'react';
import { appClient } from '@/api/localClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({ localMode: true });

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await appClient.auth.me();
      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'unknown', message: error.message || 'Failed to load user' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkUserAuth();
  }, []);

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    appClient.auth.logout(window.location.href);
  };

  const navigateToLogin = () => {
    appClient.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState: checkUserAuth
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
