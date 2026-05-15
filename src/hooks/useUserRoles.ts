import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isDevEnvironment } from '@/lib/env';
import { getDVClient } from '@/lib/dv-client';
import {
  ALL_SCREEN_IDS,
  NON_ADMIN_SCREEN_IDS,
  isFallbackAdmin,
  parseAllowedScreens,
  serializeAllowedScreens,
  type ScreenId,
} from '@/lib/screens';
import { useCurrentUser } from './useCurrentUser';
import { useSystemUsers, type SystemUser } from './useSystemUsers';

const ENTITY_SET = 'cr6cd_scproles';
const GUID_RE = /^[0-9a-f-]{36}$/i;

export type UserRole = {
  id: string;
  userId: string;
  userName: string;
  isAdmin: boolean;
  allowedScreens: ScreenId[];
};

type RawRole = {
  cr6cd_scproleid: string;
  cr6cd_label: string | null;
  cr6cd_isadmin: boolean | null;
  cr6cd_allowedscreens: string | null;
  _cr6cd_user_value: string | null;
  '_cr6cd_user_value@OData.Community.Display.V1.FormattedValue'?: string;
};

const SELECT = [
  'cr6cd_scproleid',
  'cr6cd_label',
  'cr6cd_isadmin',
  'cr6cd_allowedscreens',
  '_cr6cd_user_value',
];

function mapRole(r: RawRole): UserRole {
  return {
    id: r.cr6cd_scproleid,
    userId: r._cr6cd_user_value ?? '',
    userName:
      r['_cr6cd_user_value@OData.Community.Display.V1.FormattedValue'] ?? r.cr6cd_label ?? '',
    isAdmin: !!r.cr6cd_isadmin,
    allowedScreens: parseAllowedScreens(r.cr6cd_allowedscreens),
  };
}

const DEV_ROLES: UserRole[] = [];

function isTableMissingError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /not found|data source|unknown entity|does not exist/i.test(msg);
}

async function assertRolesTableRegistered(): Promise<void> {
  const { dataSourcesInfo } = await import('../../.power/schemas/appschemas/dataSourcesInfo');
  if (!(ENTITY_SET in (dataSourcesInfo as Record<string, unknown>))) {
    throw new Error(
      'Role table not registered yet. Run scripts/create-roles-table.ps1, then `npx power-apps add-data-source --resource-name cr6cd_scprole`, then redeploy.',
    );
  }
}

export function useRolesTableReady() {
  return useQuery<boolean>({
    queryKey: ['roles-table-ready'],
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      if (isDevEnvironment) return true;
      try {
        await assertRolesTableRegistered();
        return true;
      } catch {
        return false;
      }
    },
  });
}

export function useUserRoles() {
  return useQuery<UserRole[]>({
    queryKey: ['user-roles'],
    staleTime: 60_000,
    queryFn: async () => {
      if (isDevEnvironment) return DEV_ROLES;
      const client = await getDVClient();
      try {
        const res = await client.retrieveMultipleRecordsAsync<RawRole>(ENTITY_SET, {
          select: SELECT,
          top: 500,
        });
        return (res.data ?? []).filter((r) => !!r._cr6cd_user_value).map(mapRole);
      } catch (err) {
        if (isTableMissingError(err)) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('[useUserRoles] cr6cd_scprole not registered yet — returning empty roles:', msg);
          return [];
        }
        throw err;
      }
    },
  });
}

export type UpsertRoleInput = {
  existingId?: string;
  userId: string;
  userName: string;
  isAdmin: boolean;
  allowedScreens: ScreenId[];
};

export function useUpsertRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertRoleInput): Promise<void> => {
      if (isDevEnvironment) {
        const idx = DEV_ROLES.findIndex((r) => r.id === input.existingId || r.userId === input.userId);
        const next: UserRole = {
          id: input.existingId ?? 'role_' + Math.random().toString(36).slice(2, 9),
          userId: input.userId,
          userName: input.userName,
          isAdmin: input.isAdmin,
          allowedScreens: input.allowedScreens,
        };
        if (idx >= 0) DEV_ROLES[idx] = next;
        else DEV_ROLES.push(next);
        return;
      }
      if (!GUID_RE.test(input.userId)) {
        throw new Error(`Invalid userId: expected a GUID, got "${input.userId}"`);
      }
      await assertRolesTableRegistered();
      const client = await getDVClient();
      const allowed = serializeAllowedScreens(input.allowedScreens);
      if (input.existingId) {
        const patch: Record<string, unknown> = {
          cr6cd_label: input.userName,
          cr6cd_isadmin: input.isAdmin,
          cr6cd_allowedscreens: allowed.length > 0 ? allowed : null,
        };
        await client.updateRecordAsync(ENTITY_SET, input.existingId, patch);
      } else {
        const body: Record<string, unknown> = {
          cr6cd_label: input.userName,
          cr6cd_isadmin: input.isAdmin,
          cr6cd_allowedscreens: allowed.length > 0 ? allowed : null,
          'cr6cd_User@odata.bind': `/systemusers(${input.userId})`,
        };
        await client.createRecordAsync(ENTITY_SET, body);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-roles'] });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isDevEnvironment) {
        const idx = DEV_ROLES.findIndex((r) => r.id === id);
        if (idx >= 0) DEV_ROLES.splice(idx, 1);
        return;
      }
      await assertRolesTableRegistered();
      const client = await getDVClient();
      await client.deleteRecordAsync(ENTITY_SET, id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-roles'] });
    },
  });
}

export interface CurrentUserPermissions {
  ready: boolean;
  isAdmin: boolean;
  allowedScreens: Set<ScreenId>;
  hasAccess: (screenId: ScreenId) => boolean;
  currentUser: { id: string; name: string; email: string } | null;
  myRoleId: string | null;
}

function findMe(
  users: SystemUser[] | undefined,
  ctx: { aadObjectId: string; email: string } | null,
): SystemUser | null {
  if (!users || !ctx) return null;
  const aad = (ctx.aadObjectId || '').toLowerCase();
  const email = (ctx.email || '').toLowerCase();
  const byAad = aad ? users.find((u) => u.aadObjectId.toLowerCase() === aad) : null;
  if (byAad) return byAad;
  if (!email) return null;
  return users.find((u) => u.email.toLowerCase() === email) ?? null;
}

export function useCurrentUserPermissions(): CurrentUserPermissions {
  const { data: currentUser, isLoading: meLoading } = useCurrentUser();
  const { data: roles, isLoading: rolesLoading } = useUserRoles();
  const { data: users, isLoading: usersLoading } = useSystemUsers();

  return useMemo<CurrentUserPermissions>(() => {
    const me = findMe(users, currentUser ?? null);
    const myRole = me ? roles?.find((r) => r.userId === me.id) ?? null : null;

    const fallbackAdmin = isFallbackAdmin(currentUser?.email) || isFallbackAdmin(me?.email);
    const isAdmin = !!myRole?.isAdmin || fallbackAdmin;

    const baseAllowed: ScreenId[] = isAdmin
      ? ALL_SCREEN_IDS
      : myRole && myRole.allowedScreens.length > 0
        ? myRole.allowedScreens
        : NON_ADMIN_SCREEN_IDS;
    const allowedScreens = new Set<ScreenId>(baseAllowed);

    const ready = !meLoading && !rolesLoading && !usersLoading && !!currentUser;

    return {
      ready,
      isAdmin,
      allowedScreens,
      hasAccess: (id: ScreenId) => allowedScreens.has(id),
      currentUser: currentUser
        ? {
            id: me?.id ?? '',
            name: currentUser.fullName,
            email: (me?.email || currentUser.email || '').toLowerCase(),
          }
        : null,
      myRoleId: myRole?.id ?? null,
    };
  }, [currentUser, roles, users, meLoading, rolesLoading, usersLoading]);
}
