import { useCallback, useEffect, useState } from 'react';
import * as api from '@/api/users';
import type { AppUser, UserRole } from '@/types/user';

export interface UserFormInput {
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Simulates fetching + mutating the user directory from an API (artificial
 * delay + local state). Swap the body of refetch for a real
 * apiClient.get('/users') call later without touching any consumer.
 */
export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    api.listUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => refetch(), [refetch]);

  const addUser = useCallback(async (input: UserFormInput) => {
    try {
      const user = await api.createUser(input);
      setUsers((prev) => [user, ...prev]);
      return user;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  const updateUser = useCallback(async (userId: string, input: UserFormInput) => {
    try {
      const updatedFields = await api.updateUser(userId, input);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updatedFields } : u)));
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  const removeUser = useCallback(async (userId: string) => {
    try {
      await api.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  return { users, loading, refetch, addUser, updateUser, removeUser };
}
