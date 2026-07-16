import { apiClient } from './client';
import type { AppUser } from '@/types/user';
import type { UserFormInput } from '@/hooks/useUsers';

export async function listUsers(): Promise<AppUser[]> {
  const { data } = await apiClient.get<{ items: AppUser[] }>('/users');
  return data.items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createUser(input: UserFormInput): Promise<AppUser> {
  const { data } = await apiClient.post<AppUser>('/users', input);
  return data;
}

export async function updateUser(userId: string, input: UserFormInput): Promise<AppUser> {
  const { data } = await apiClient.put<AppUser>(`/users/${userId}`, input);
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}`);
}
