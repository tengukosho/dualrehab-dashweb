import { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authApi.getCurrentUser();
        const userData = response.data;
        
        // Only allow admin/expert to stay logged in
        if (userData.role !== 'admin' && userData.role !== 'expert') {
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser(userData);
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    const userData = response.data.user;
    
    // Check if user is admin or expert (not patient)
    if (userData.role !== 'admin' && userData.role !== 'expert') {
      throw new Error('Access denied. Admin or Expert account required.');
    }
    
    localStorage.setItem('token', response.data.token);
    setUser(userData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
