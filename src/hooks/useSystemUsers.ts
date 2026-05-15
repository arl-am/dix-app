import { useQuery } from '@tanstack/react-query';
import { isDevEnvironment } from '@/lib/env';
import { getDVClient } from '@/lib/dv-client';

export type SystemUser = {
  id: string;
  fullName: string;
  email: string;
  aadObjectId: string;
};

type RawSystemUser = {
  systemuserid: string;
  fullname?: string;
  internalemailaddress?: string;
  azureactivedirectoryobjectid?: string;
};

const DEV_SYSTEM_USERS: SystemUser[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    fullName: 'Anderson Marquez',
    email: 'a.marquez@miasafety.com',
    aadObjectId: '00000000-0000-0000-0000-000000000000',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    fullName: 'Tatiana Bone',
    email: 't.bone@miasafety.com',
    aadObjectId: '00000000-0000-0000-0000-000000000001',
  },
];

export function useSystemUsers() {
  return useQuery<SystemUser[]>({
    queryKey: ['system-users'],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      if (isDevEnvironment) return DEV_SYSTEM_USERS;
      const client = await getDVClient();
      const res = await client.retrieveMultipleRecordsAsync<RawSystemUser>('systemusers', {
        select: ['systemuserid', 'fullname', 'internalemailaddress', 'azureactivedirectoryobjectid'],
        // Interactive humans only: enabled, not an application/S2S user, accessmode=0 (Read-Write).
        // This excludes Microsoft service accounts, integration users, and stub system rows.
        filter: 'isdisabled eq false and applicationid eq null and accessmode eq 0',
        orderBy: ['fullname asc'],
        top: 5000,
      });
      return (res.data ?? [])
        .filter((u) => !!u.systemuserid && !!u.internalemailaddress && !!u.azureactivedirectoryobjectid)
        .map<SystemUser>((u) => ({
          id: u.systemuserid,
          fullName: u.fullname ?? '',
          email: (u.internalemailaddress ?? '').toLowerCase(),
          aadObjectId: u.azureactivedirectoryobjectid ?? '',
        }));
    },
  });
}
