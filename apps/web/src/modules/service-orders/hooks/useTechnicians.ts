import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export function useTechnicians() {
  return useQuery<User[]>({
    queryKey: ['technicians'],
    queryFn: async () => {
      const response = await api.get('/users');
      // Filter mechanics
      const allUsers = response.data.data || [];
      return allUsers.filter((u: User) => u.role === 'MECHANIC' && u.active);
    }
  });
}
