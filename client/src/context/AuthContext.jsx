import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setProfile(res.data.profile);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setProfile(res.data.profile);
    return res.data;
  };

  const registerStudent = async (data) => {
    const res = await api.post('/auth/register/student', data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setProfile(res.data.profile);
    return res.data;
  };

  const registerFaculty = async (data) => {
    const res = await api.post('/auth/register/faculty', data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setProfile(res.data.profile);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    login,
    registerStudent,
    registerFaculty,
    logout,
    checkAuth,
    isAuthenticated: !!user,
    isFaculty: user?.role === 'faculty',
    isStudent: user?.role === 'student',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

