import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { API_URL } from '../config';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Verify session by fetching profile
      const response = await fetch(`${API_URL}/api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'profile.get' })
      });

      const data = await response.json();

      if (data.ok && data.profile) {
        const storedUser = localStorage.getItem('session_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {}
        }
        setLoading(false);
      } else {
        // Invalid session, remove token
        localStorage.removeItem('session_token');
        localStorage.removeItem('session_user');
        setLoading(false);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (token) {
        await fetch(`${API_URL}/api`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'auth.logout' })
        });
      }
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      localStorage.removeItem('session_token');
      localStorage.removeItem('session_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
