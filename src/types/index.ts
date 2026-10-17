
export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  managerId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
