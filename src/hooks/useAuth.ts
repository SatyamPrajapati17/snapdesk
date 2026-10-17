
import { create } from 'zustand';
import { User, UserRole, AuthState } from '@/types';

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  login: (email, role) => {
    // Mock login: create a dummy user based on role
    const user: User = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      email,
      role,
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
    };
    set({ user, isAuthenticated: true });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
