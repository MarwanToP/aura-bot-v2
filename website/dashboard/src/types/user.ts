export type UserRole = 'admin' | 'moderator' | 'developer' | 'viewer';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  role: UserRole;
  permissions: string[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}
