
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('digilocker_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  // Simulating login functionality
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      // In a real app, we would make an API call here
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user for demo purposes
      if (email === 'demo@example.com' && password === 'password') {
        const mockUser = {
          id: '1',
          name: 'Demo User',
          email: 'demo@example.com',
          avatar: 'https://i.pravatar.cc/150?img=1'
        };
        
        localStorage.setItem('digilocker_user', JSON.stringify(mockUser));
        setUser(mockUser);
        toast.success("Logged in successfully");
        navigate('/dashboard');
      } else {
        toast.error("Invalid email or password");
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock signup
      const mockUser = {
        id: Date.now().toString(),
        name,
        email,
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
      };
      
      localStorage.setItem('digilocker_user', JSON.stringify(mockUser));
      setUser(mockUser);
      toast.success("Account created successfully");
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('digilocker_user');
    localStorage.removeItem('digilocker_documents');
    setUser(null);
    toast.info("Logged out successfully");
    navigate('/');
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
