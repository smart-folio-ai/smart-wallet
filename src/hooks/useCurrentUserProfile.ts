import {useQuery} from '@tanstack/react-query';
import Profile from '@/services/profile';

export function useCurrentUserProfile() {
  return useQuery({
    queryKey: ['current-user-profile'],
    queryFn: () => Profile.getProfile(),
    staleTime: 5 * 60 * 1000,
  });
}
