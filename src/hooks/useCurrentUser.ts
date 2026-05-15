import { useQuery } from '@tanstack/react-query';
import { isDevEnvironment } from '@/lib/env';
import { initials } from '@/lib/utils';

export type CurrentUser = {
  fullName: string;
  email: string;
  initials: string;
  aadObjectId: string;
};

const DEV_USER: CurrentUser = {
  fullName: 'Dev User',
  email: 'a.marquez@miasafety.com',
  initials: 'DU',
  aadObjectId: '00000000-0000-0000-0000-000000000000',
};

type PowerAppsUserContext = {
  user?: {
    fullName?: string;
    userPrincipalName?: string;
    objectId?: string;
  };
};

export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: ['current-user'],
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      if (isDevEnvironment) return DEV_USER;
      const mod = await import('@microsoft/power-apps/app');
      const getContext = (mod as unknown as { getContext: () => Promise<PowerAppsUserContext> }).getContext;
      const ctx = await getContext();
      const fullName = ctx.user?.fullName ?? '';
      const email = ctx.user?.userPrincipalName ?? '';
      const display = fullName || email.split('@')[0] || 'User';
      return {
        fullName: display,
        email,
        initials: initials(display),
        aadObjectId: ctx.user?.objectId ?? '',
      };
    },
  });
}
