export type UserRole = 'Administrator' | 'Operator' | 'Viewer';
export type UserStatus = 'active' | 'invited' | 'suspended';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastActive: string; // ISO timestamp
  createdAt: string;
}
