# Portable Settings Page — Paste Bundle

This bundle replicates the SCP app's **Settings** screen (per-user role / screen-access
management with hero stats, search, admin toggle, screen-visibility chips, "Add user"
dialog, fallback admins, reset-to-default) in another Power Apps Code App.

## How to use this file

1. Drop this whole file into the other repo (anywhere — `settings-page-portable.md` at the root is fine).
2. In that codespace, tell Claude: **"Read settings-page-portable.md and apply it. Customize the SCREENS array in src/lib/screens.ts to match this app's routes."**
3. Claude will create every file below, run the Dataverse provisioning, and wire it into the router.

You should not need to write any of the code yourself.

---

## Assumptions about the target app

This is built for **another Power Apps Code App** that shares the SCP/CLAUDE.md
template — same Tailwind, same shadcn-style UI primitives, same Dataverse pattern.

The target app must already have:

- `tailwindcss`, `clsx`, `tailwind-merge`
- `@tanstack/react-query` (with a `QueryClientProvider` at the root)
- `sonner` (with `<Toaster />` mounted somewhere global)
- `framer-motion`
- `lucide-react`
- `@radix-ui/react-dialog`
- `@microsoft/power-apps` + `@microsoft/power-apps-cli`
- `react-router-dom`
- shadcn-style UI components (`card`, `button`, `input`, `badge`, `dialog`, `skeleton`)
- a `cn()` helper in `src/lib/utils.ts`
- the `isDevEnvironment` Codespaces-aware check (CLAUDE.md "Local / Codespaces Dev Environment Detection")

If any of those are missing, install them first. The full file list below assumes
they exist.

---

## Step 1 — Provision the Dataverse role table

Create `scripts/create-roles-table.ps1` in the target repo with the contents below,
then run `pwsh -NoProfile -File ./scripts/create-roles-table.ps1`. Complete the
device-code flow in any browser. **Update the `$SolutionName` and `$Prefix` to
match the target app** (e.g. `cr6cd` and `OtherApp`).

```powershell
$ErrorActionPreference = 'Stop'

$TenantId       = '1ab993e6-5837-45e4-a231-6466807ddb34'
$ClientId       = '51f81489-12ee-4a9e-aaae-a2591f45987d'
$OrgUrl         = 'https://org71748d11.crm.dynamics.com'
$Prefix         = 'cr6cd'
$SolutionName   = 'TargetAppApp'   # <-- CHANGE to the target app's unmanaged solution

$Scope = "$OrgUrl/.default offline_access"

# --- Device code auth (works in Codespaces; paste the code into any browser) ---
$dc = Invoke-RestMethod -Method POST `
  -Uri "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/devicecode" `
  -Body @{ client_id = $ClientId; scope = $Scope }
Write-Host "`nGo to $($dc.verification_uri) and enter code: $($dc.user_code)`n" -ForegroundColor Yellow
$expires = (Get-Date).AddSeconds($dc.expires_in)
$token = $null
while (-not $token -and (Get-Date) -lt $expires) {
  Start-Sleep -Seconds $dc.interval
  try {
    $resp = Invoke-RestMethod -Method POST `
      -Uri "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token" `
      -Body @{
        grant_type  = 'urn:ietf:params:oauth:grant-type:device_code'
        client_id   = $ClientId
        device_code = $dc.device_code
      }
    $token = $resp.access_token
  } catch {
    $err = ($_.ErrorDetails.Message | ConvertFrom-Json).error
    if ($err -ne 'authorization_pending' -and $err -ne 'slow_down') { throw }
  }
}
if (-not $token) { throw 'Auth timed out.' }

$headers = @{
  Authorization     = "Bearer $token"
  'Content-Type'    = 'application/json; charset=utf-8'
  Accept            = 'application/json'
  'OData-Version'   = '4.0'
  'OData-MaxVersion'= '4.0'
  'MSCRM.SolutionName' = $SolutionName
}

$tableLogical = "${Prefix}_scprole"
$tableSchema  = "${Prefix}_SCPRole"
$tableSet     = "${Prefix}_scproles"

# --- Create the table ---
$entityBody = @{
  '@odata.type'           = 'Microsoft.Dynamics.CRM.EntityMetadata'
  SchemaName              = $tableSchema
  LogicalName             = $tableLogical
  EntitySetName           = $tableSet
  DisplayName             = @{ LocalizedLabels = @(@{ Label = 'SCP Role'; LanguageCode = 1033 }) }
  DisplayCollectionName   = @{ LocalizedLabels = @(@{ Label = 'SCP Roles'; LanguageCode = 1033 }) }
  Description             = @{ LocalizedLabels = @(@{ Label = 'Per-user screen access role'; LanguageCode = 1033 }) }
  OwnershipType           = 'UserOwned'
  HasActivities           = $false
  HasNotes                = $false
  IsActivity              = $false
  Attributes = @(
    @{
      '@odata.type' = 'Microsoft.Dynamics.CRM.StringAttributeMetadata'
      SchemaName    = "${Prefix}_Label"
      LogicalName   = "${Prefix}_label"
      DisplayName   = @{ LocalizedLabels = @(@{ Label = 'Label'; LanguageCode = 1033 }) }
      RequiredLevel = @{ Value = 'ApplicationRequired' }
      MaxLength     = 200
      IsPrimaryName = $true
    }
  )
} | ConvertTo-Json -Depth 25

Invoke-RestMethod -Method POST -Uri "$OrgUrl/api/data/v9.2/EntityDefinitions" `
  -Headers $headers -Body $entityBody | Out-Null
Write-Host "Created table $tableLogical" -ForegroundColor Green

# --- Columns ---
$cols = @(
  @{
    '@odata.type' = 'Microsoft.Dynamics.CRM.BooleanAttributeMetadata'
    SchemaName    = "${Prefix}_IsAdmin"
    LogicalName   = "${Prefix}_isadmin"
    DisplayName   = @{ LocalizedLabels = @(@{ Label = 'Is Admin'; LanguageCode = 1033 }) }
    RequiredLevel = @{ Value = 'None' }
    DefaultValue  = $false
    OptionSet     = @{
      TrueOption  = @{ Value = 1; Label = @{ LocalizedLabels = @(@{ Label = 'Yes'; LanguageCode = 1033 }) } }
      FalseOption = @{ Value = 0; Label = @{ LocalizedLabels = @(@{ Label = 'No';  LanguageCode = 1033 }) } }
    }
  },
  @{
    '@odata.type' = 'Microsoft.Dynamics.CRM.StringAttributeMetadata'
    SchemaName    = "${Prefix}_AllowedScreens"
    LogicalName   = "${Prefix}_allowedscreens"
    DisplayName   = @{ LocalizedLabels = @(@{ Label = 'Allowed Screens'; LanguageCode = 1033 }) }
    RequiredLevel = @{ Value = 'None' }
    MaxLength     = 2000
    Description   = @{ LocalizedLabels = @(@{ Label = 'CSV of screen ids, e.g. dashboard,probations'; LanguageCode = 1033 }) }
  }
)
foreach ($c in $cols) {
  Invoke-RestMethod -Method POST `
    -Uri "$OrgUrl/api/data/v9.2/EntityDefinitions(LogicalName='$tableLogical')/Attributes" `
    -Headers $headers -Body ($c | ConvertTo-Json -Depth 25) | Out-Null
  Write-Host "  + $($c.LogicalName)" -ForegroundColor Green
}

# --- Lookup to systemuser ---
$lookup = @{
  '@odata.type'           = 'Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata'
  SchemaName              = "${Prefix}_SCPRole_User_SystemUser"
  ReferencedEntity        = 'systemuser'
  ReferencingEntity       = $tableLogical
  ReferencedAttribute     = 'systemuserid'
  Lookup = @{
    '@odata.type' = 'Microsoft.Dynamics.CRM.LookupAttributeMetadata'
    SchemaName    = "${Prefix}_User"
    LogicalName   = "${Prefix}_user"
    DisplayName   = @{ LocalizedLabels = @(@{ Label = 'User'; LanguageCode = 1033 }) }
    RequiredLevel = @{ Value = 'ApplicationRequired' }
  }
  AssociatedMenuConfiguration = @{ Behavior = 'UseLabel'; Group = 'Details'; Order = 10000; Label = @{ LocalizedLabels = @(@{ Label = 'SCP Roles'; LanguageCode = 1033 }) } }
  CascadeConfiguration = @{ Assign = 'NoCascade'; Delete = 'RemoveLink'; Merge = 'NoCascade'; Reparent = 'NoCascade'; Share = 'NoCascade'; Unshare = 'NoCascade' }
}
Invoke-RestMethod -Method POST -Uri "$OrgUrl/api/data/v9.2/RelationshipDefinitions" `
  -Headers $headers -Body ($lookup | ConvertTo-Json -Depth 25) | Out-Null
Write-Host "Created lookup ${Prefix}_user -> systemuser" -ForegroundColor Green

Write-Host "`nDone." -ForegroundColor Cyan
```

> If your prefix is not `cr6cd`, **rename every `cr6cd_` token in every file below** (one
> sweep with find/replace in your editor). The hooks expect `cr6cd_scprole(s)`.

---

## Step 2 — Register the data sources

```bash
npx power-apps add-data-source --api-id dataverse \
  --resource-name systemuser \
  -u https://org71748d11.crm.dynamics.com --non-interactive

npx power-apps add-data-source --api-id dataverse \
  --resource-name cr6cd_scprole \
  -u https://org71748d11.crm.dynamics.com --non-interactive
```

Both are logical names (singular). This regenerates `.power/schemas/`.

---

## Step 3 — Files to create

### `src/lib/env.ts`

If your target already has this, leave it. Otherwise:

```ts
export const isDevEnvironment =
  (typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.app.github.dev'))) ||
  import.meta.env.DEV === true;
```

### `src/lib/utils.ts` (additions — merge with whatever's there)

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
```

### `src/lib/avatar.ts`

```ts
const AVATAR_PALETTE = [
  { bg: '#3B82F6', ring: 'rgba(59,130,246,0.30)' },
  { bg: '#10B981', ring: 'rgba(16,185,129,0.30)' },
  { bg: '#8B5CF6', ring: 'rgba(139,92,246,0.30)' },
  { bg: '#F59E0B', ring: 'rgba(245,158,11,0.30)' },
  { bg: '#EF4444', ring: 'rgba(239,68,68,0.30)' },
  { bg: '#EC4899', ring: 'rgba(236,72,153,0.30)' },
  { bg: '#14B8A6', ring: 'rgba(20,184,166,0.30)' },
  { bg: '#6366F1', ring: 'rgba(99,102,241,0.30)' },
  { bg: '#F97316', ring: 'rgba(249,115,22,0.30)' },
  { bg: '#0EA5E9', ring: 'rgba(14,165,233,0.30)' },
  { bg: '#84CC16', ring: 'rgba(132,204,22,0.30)' },
  { bg: '#A855F7', ring: 'rgba(168,85,247,0.30)' },
] as const;

export type AvatarColor = (typeof AVATAR_PALETTE)[number];

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickAvatarColor(seed: string | null | undefined): AvatarColor {
  const key = (seed ?? '').trim().toLowerCase();
  if (!key) return AVATAR_PALETTE[0];
  return AVATAR_PALETTE[hashString(key) % AVATAR_PALETTE.length];
}
```

### `src/lib/dv-client.ts`

```ts
import { isDevEnvironment } from './env';

export type DvClient = {
  retrieveMultipleRecordsAsync<T>(
    entitySetName: string,
    options?: { select?: string[]; filter?: string; orderBy?: string[]; top?: number },
  ): Promise<{ data: T[] }>;
  retrieveRecordAsync<T>(
    entitySetName: string,
    id: string,
    options?: { select?: string[] },
  ): Promise<{ data: T }>;
  createRecordAsync<TIn, TOut>(entitySetName: string, body: TIn): Promise<{ data: TOut }>;
  updateRecordAsync<TIn, TOut>(entitySetName: string, id: string, patch: TIn): Promise<{ data: TOut }>;
  deleteRecordAsync(entitySetName: string, id: string): Promise<{ data: unknown }>;
};

let clientPromise: Promise<DvClient> | null = null;

export async function getDVClient(): Promise<DvClient> {
  if (isDevEnvironment) {
    throw new Error('getDVClient() called in dev. Hooks must short-circuit to mock data.');
  }
  if (!clientPromise) {
    clientPromise = (async () => {
      const [{ getClient }, { dataSourcesInfo }] = await Promise.all([
        import('@microsoft/power-apps/data'),
        import('../../.power/schemas/appschemas/dataSourcesInfo'),
      ]);
      return getClient(dataSourcesInfo as never) as unknown as DvClient;
    })();
  }
  return clientPromise;
}
```

### `src/lib/screens.ts` — **CUSTOMIZE FOR THE TARGET APP**

Replace the `SCREENS` array with the target app's actual screens. Also update
`ADMIN_FALLBACK_EMAILS` to whoever should never be locked out.

```ts
import {
  type LucideIcon,
  LayoutDashboard,
  Settings as SettingsIcon,
} from 'lucide-react';

export type ScreenId = 'dashboard' | 'settings'; // <-- expand for the target app

export interface ScreenDef {
  id: ScreenId;
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

// CUSTOMIZE: list every route in the target app, including the new Settings page.
export const SCREENS: ScreenDef[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Welcome page.',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Per-user screen access and admin controls.',
    path: '/settings',
    icon: SettingsIcon,
    adminOnly: true,
  },
];

export const ALL_SCREEN_IDS: ScreenId[] = SCREENS.map((s) => s.id);
export const NON_ADMIN_SCREEN_IDS: ScreenId[] = SCREENS.filter((s) => !s.adminOnly).map((s) => s.id);

// CUSTOMIZE: emails that always have admin access even with no role row.
export const ADMIN_FALLBACK_EMAILS: readonly string[] = [
  'a.marquez@miasafety.com',
];

export function isFallbackAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_FALLBACK_EMAILS.includes(email.toLowerCase().trim());
}

export function parseAllowedScreens(raw: string | null | undefined): ScreenId[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ScreenId => (ALL_SCREEN_IDS as string[]).includes(s));
}

export function serializeAllowedScreens(list: ScreenId[]): string {
  return Array.from(new Set(list)).join(',');
}

export function getScreenDef(id: ScreenId): ScreenDef | undefined {
  return SCREENS.find((s) => s.id === id);
}
```

### `src/hooks/useCurrentUser.ts`

```ts
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

export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: ['current-user'],
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      if (isDevEnvironment) return DEV_USER;
      const { getContext } = await import('@microsoft/power-apps/app');
      const ctx = await getContext();
      const fullName = ctx.user.fullName ?? '';
      const email = ctx.user.userPrincipalName ?? '';
      const display = fullName || email.split('@')[0] || 'User';
      return {
        fullName: display,
        email,
        initials: initials(display),
        aadObjectId: ctx.user.objectId ?? '',
      };
    },
  });
}
```

### `src/hooks/useSystemUsers.ts`

```ts
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
        filter: 'isdisabled eq false',
        orderBy: ['fullname asc'],
        top: 5000,
      });
      return (res.data ?? [])
        .filter((u) => !!u.systemuserid)
        .map<SystemUser>((u) => ({
          id: u.systemuserid,
          fullName: u.fullname ?? '',
          email: (u.internalemailaddress ?? '').toLowerCase(),
          aadObjectId: u.azureactivedirectoryobjectid ?? '',
        }));
    },
  });
}
```

### `src/hooks/useUserRoles.ts`

```ts
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

export function useUserRoles() {
  return useQuery<UserRole[]>({
    queryKey: ['user-roles'],
    staleTime: 60_000,
    queryFn: async () => {
      if (isDevEnvironment) return DEV_ROLES;
      const client = await getDVClient();
      const res = await client.retrieveMultipleRecordsAsync<RawRole>(ENTITY_SET, {
        select: SELECT,
        top: 500,
      });
      return (res.data ?? []).filter((r) => !!r._cr6cd_user_value).map(mapRole);
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
```

### `src/components/ui/avatar.tsx`

```tsx
import { cn, initials } from '@/lib/utils';
import { pickAvatarColor } from '@/lib/avatar';

type AvatarProps = {
  name: string | null | undefined;
  seed?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  online?: boolean;
  className?: string;
  ringClass?: string;
};

const SIZE = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-10 w-10 text-xs',
} as const;

const DOT_SIZE = {
  xs: 'h-2 w-2',
  sm: 'h-2.5 w-2.5',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
} as const;

export function Avatar({ name, seed, size = 'md', online, className, ringClass }: AvatarProps) {
  const display = name || 'User';
  const color = pickAvatarColor(seed ?? display);
  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <div
        style={{ backgroundColor: color.bg }}
        className={cn(
          'flex items-center justify-center rounded-full font-semibold text-white shadow-sm',
          SIZE[size],
          ringClass,
        )}
      >
        {initials(display)}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            'absolute -right-0.5 -bottom-0.5 rounded-full ring-2 ring-background',
            DOT_SIZE[size],
            online ? 'bg-emerald-500' : 'bg-slate-400',
          )}
          aria-label={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
```

### `src/components/ui/toggle-switch.tsx`

```tsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ToggleSwitchSize = 'sm' | 'md';

const SIZE_TRACK: Record<ToggleSwitchSize, string> = { sm: 'h-5 w-9', md: 'h-7 w-12' };
const SIZE_THUMB: Record<ToggleSwitchSize, string> = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5' };
const SIZE_THUMB_ON: Record<ToggleSwitchSize, number> = { sm: 16, md: 22 };
const SIZE_THUMB_OFF: Record<ToggleSwitchSize, number> = { sm: 2, md: 2 };

export type ToggleSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  size?: ToggleSwitchSize;
  ariaLabel?: string;
  className?: string;
};

export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  size = 'md',
  ariaLabel,
  className,
}: ToggleSwitchProps) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className={cn(
        'group relative inline-flex shrink-0 cursor-pointer items-center rounded-full',
        'transition-[background-color,box-shadow] duration-300 ease-out',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25',
        SIZE_TRACK[size],
        checked
          ? 'bg-gradient-to-r from-primary to-blue-500 shadow-[0_2px_8px_-2px_rgba(37,99,235,0.5)]'
          : 'bg-slate-200 shadow-inner shadow-slate-300/40 dark:bg-slate-700 dark:shadow-slate-900/40',
        !disabled && !checked && 'hover:bg-slate-300 dark:hover:bg-slate-600',
        !disabled && checked && 'hover:shadow-[0_2px_12px_-1px_rgba(37,99,235,0.65)]',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset transition-colors duration-300',
          checked ? 'ring-white/20' : 'ring-black/[0.04] dark:ring-white/10',
        )}
      />
      <motion.span
        aria-hidden
        layout
        animate={{
          x: checked ? SIZE_THUMB_ON[size] : SIZE_THUMB_OFF[size],
          scale: checked ? 1.02 : 1,
        }}
        transition={{ type: 'spring', stiffness: 600, damping: 32, mass: 0.6 }}
        className={cn(
          'relative z-10 inline-flex items-center justify-center rounded-full bg-white shadow-md',
          'transition-[box-shadow] duration-200',
          SIZE_THUMB[size],
          checked
            ? 'shadow-[0_2px_6px_rgba(0,0,0,0.18)] ring-1 ring-black/5'
            : 'shadow-[0_1px_3px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]',
          !disabled && 'group-hover:shadow-[0_3px_8px_rgba(0,0,0,0.22)]',
        )}
      >
        <motion.span
          aria-hidden
          initial={false}
          animate={{ opacity: checked ? 1 : 0, scale: checked ? 1 : 0.6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={cn(
            'block rounded-full bg-gradient-to-br from-primary to-blue-500',
            size === 'sm' ? 'h-1 w-1' : 'h-1.5 w-1.5',
          )}
        />
      </motion.span>
    </motion.button>
  );
}
```

### `src/components/ui/confirm-dialog.tsx`

```tsx
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type ConfirmTone = 'destructive' | 'default';

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: ConfirmTone;
    resolve?: (v: boolean) => void;
  }>({ open: false, title: '' });

  const confirm = (input: {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: ConfirmTone;
  }): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
      setState({ ...input, open: true, resolve });
    });

  const close = (value: boolean) => {
    state.resolve?.(value);
    setState((s) => ({ ...s, open: false, resolve: undefined }));
  };

  const tone: ConfirmTone = state.tone ?? 'destructive';

  const node = (
    <Dialog open={state.open} onOpenChange={(o) => !o && close(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {tone === 'destructive' && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle>{state.title}</DialogTitle>
              {state.description && (
                <DialogDescription className="mt-1.5">{state.description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)}>
            {state.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            variant={tone === 'destructive' ? 'destructive' : 'default'}
            onClick={() => close(true)}
          >
            {state.confirmLabel ?? 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { confirm, dialogNode: node };
}
```

### `src/components/page-motion.tsx`

```tsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function PageMotion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('space-y-6', className)}
    >
      {children}
    </motion.div>
  );
}
```

### `src/pages/settings.tsx`

```tsx
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users as UsersIcon,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageMotion } from '@/components/page-motion';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSystemUsers, type SystemUser } from '@/hooks/useSystemUsers';
import {
  useUserRoles,
  useUpsertRole,
  useDeleteRole,
  useCurrentUserPermissions,
  type UserRole,
} from '@/hooks/useUserRoles';
import {
  ALL_SCREEN_IDS,
  NON_ADMIN_SCREEN_IDS,
  SCREENS,
  isFallbackAdmin,
  type ScreenId,
} from '@/lib/screens';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

type EffectiveUser = {
  id: string;
  fullName: string;
  email: string;
  isFallback: boolean;
  role: UserRole | null;
};

function buildVisibleUsers(opts: {
  systemUsers: SystemUser[];
  roles: UserRole[];
  meId: string;
}): EffectiveUser[] {
  const { systemUsers, roles, meId } = opts;
  const byId = new Map<string, SystemUser>();
  for (const u of systemUsers) byId.set(u.id, u);

  const fallback = systemUsers.filter((u) => isFallbackAdmin(u.email));
  const fallbackIds = new Set(fallback.map((u) => u.id));
  const roleIds = new Set(roles.map((r) => r.userId).filter(Boolean));

  const ids = new Set<string>();
  for (const u of fallback) ids.add(u.id);
  for (const id of roleIds) ids.add(id);
  if (meId) ids.add(meId);

  const list: EffectiveUser[] = [];
  for (const id of ids) {
    const su = byId.get(id);
    if (!su) continue;
    list.push({
      id: su.id,
      fullName: su.fullName || su.email || 'Unknown',
      email: su.email,
      isFallback: fallbackIds.has(su.id),
      role: roles.find((r) => r.userId === su.id) ?? null,
    });
  }

  return list.sort((a, b) => {
    if (a.id === meId) return -1;
    if (b.id === meId) return 1;
    if (a.isFallback !== b.isFallback) return a.isFallback ? -1 : 1;
    return a.fullName.localeCompare(b.fullName);
  });
}

function effectiveAllowed(u: EffectiveUser): Set<ScreenId> {
  if (u.isFallback || u.role?.isAdmin) return new Set(ALL_SCREEN_IDS);
  if (u.role && u.role.allowedScreens.length > 0) return new Set(u.role.allowedScreens);
  return new Set(NON_ADMIN_SCREEN_IDS);
}

function effectiveAdmin(u: EffectiveUser): boolean {
  return u.isFallback || !!u.role?.isAdmin;
}

const ALL_NON_ADMIN_SCREENS = SCREENS.filter((s) => !s.adminOnly);

export function SettingsPage() {
  useCurrentUser();
  const perms = useCurrentUserPermissions();
  const usersQ = useSystemUsers();
  const rolesQ = useUserRoles();
  const upsert = useUpsertRole();
  const del = useDeleteRole();
  const { confirm, dialogNode } = useConfirmDialog();

  const [q, setQ] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const visibleUsers = useMemo<EffectiveUser[]>(() => {
    if (!usersQ.data || !rolesQ.data) return [];
    return buildVisibleUsers({
      systemUsers: usersQ.data,
      roles: rolesQ.data,
      meId: perms.currentUser?.id ?? '',
    });
  }, [usersQ.data, rolesQ.data, perms.currentUser]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return visibleUsers;
    return visibleUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle),
    );
  }, [visibleUsers, q]);

  const stats = useMemo(() => {
    const total = visibleUsers.length;
    const admins = visibleUsers.filter(effectiveAdmin).length;
    const customized = visibleUsers.filter(
      (u) => u.role && !u.role.isAdmin && u.role.allowedScreens.length > 0,
    ).length;
    return { total, admins, customized, screens: ALL_NON_ADMIN_SCREENS.length };
  }, [visibleUsers]);

  const isLoading = usersQ.isLoading || rolesQ.isLoading;
  const isError = usersQ.isError || rolesQ.isError;

  async function persist(u: EffectiveUser, patch: { isAdmin?: boolean; allowed?: Set<ScreenId> }) {
    if (u.isFallback) return;
    const nextAdmin = patch.isAdmin ?? effectiveAdmin(u);
    const nextAllowedSet = patch.allowed ?? effectiveAllowed(u);
    const nextAllowed = nextAdmin
      ? []
      : ALL_NON_ADMIN_SCREENS.map((s) => s.id).filter((id) => nextAllowedSet.has(id));
    try {
      await upsert.mutateAsync({
        existingId: u.role?.id,
        userId: u.id,
        userName: u.fullName,
        isAdmin: nextAdmin,
        allowedScreens: nextAllowed,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update permissions');
    }
  }

  async function handleReset(u: EffectiveUser) {
    if (u.isFallback || !u.role) return;
    const ok = await confirm({
      title: 'Reset to default access?',
      description: `${u.fullName} will go back to default access (sees every screen except Settings).`,
      confirmLabel: 'Reset',
      tone: 'destructive',
    });
    if (!ok) return;
    try {
      await del.mutateAsync(u.role.id);
      toast.success(`Reset ${u.fullName} to default access.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset role');
    }
  }

  function handleAdminToggle(u: EffectiveUser, next: boolean) {
    const isMe = u.id === perms.currentUser?.id;
    if (isMe && !next) {
      const otherAdmins = visibleUsers.filter((v) => v.id !== u.id && effectiveAdmin(v)).length;
      if (otherAdmins === 0) {
        toast.error("You're the only admin. Promote someone else first.");
        return;
      }
    }
    void persist(u, { isAdmin: next });
  }

  function handleScreenToggle(u: EffectiveUser, screen: ScreenId) {
    const current = effectiveAllowed(u);
    const next = new Set(current);
    if (next.has(screen)) next.delete(screen);
    else next.add(screen);
    void persist(u, { allowed: next });
  }

  return (
    <PageMotion>
      <SettingsHero stats={stats} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search users by name or email…"
                className="pl-9"
              />
            </div>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold tabular-nums">
              {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
            </Badge>
            {perms.isAdmin && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" />
                Add user
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Couldn't load users or roles. Refresh and try again.
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No users match that search.
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isMe={u.id === perms.currentUser?.id}
                  onAdminToggle={(next) => handleAdminToggle(u, next)}
                  onScreenToggle={(screen) => handleScreenToggle(u, screen)}
                  onReset={() => handleReset(u)}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {dialogNode}

      <AddUserDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        systemUsers={usersQ.data ?? []}
        existingIds={new Set(visibleUsers.map((u) => u.id))}
        onAdd={async (su) => {
          try {
            await upsert.mutateAsync({
              userId: su.id,
              userName: su.fullName || su.email || 'User',
              isAdmin: false,
              allowedScreens: [],
            });
            toast.success(`Added ${su.fullName || su.email}`);
            setAddOpen(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add user');
          }
        }}
      />
    </PageMotion>
  );
}

function AddUserDialog({
  open,
  onClose,
  systemUsers,
  existingIds,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  systemUsers: SystemUser[];
  existingIds: Set<string>;
  onAdd: (u: SystemUser) => Promise<void> | void;
}) {
  const [search, setSearch] = useState('');

  const candidates = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const list = systemUsers.filter((u) => !existingIds.has(u.id));
    if (!needle) return list.slice(0, 50);
    return list
      .filter(
        (u) =>
          u.fullName.toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle),
      )
      .slice(0, 50);
  }, [systemUsers, existingIds, search]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setSearch('');
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add user to this app</DialogTitle>
          <DialogDescription>
            Pick a teammate from your tenant. They'll get default access (every screen except
            Settings) and you can promote them to admin afterwards.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-9"
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-lg border bg-card">
            {candidates.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                {search ? 'No matches.' : 'Everyone in your tenant has already been added.'}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {candidates.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => void onAdd(u)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent/40"
                    >
                      <Avatar name={u.fullName || u.email} seed={u.email || u.id} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {u.fullName || u.email || 'User'}
                        </div>
                        {u.email && (
                          <div className="truncate text-[11px] text-muted-foreground">
                            {u.email}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingsHero({
  stats,
}: {
  stats: { total: number; admins: number; customized: number; screens: number };
}) {
  return (
    <Card className="overflow-hidden border-0">
      <div className="relative bg-gradient-to-br from-primary via-blue-600 to-purple-600 p-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_55%)]" aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              <Sparkles className="h-3.5 w-3.5" />
              Access control
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Settings</h1>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Promote admins and curate which screens each teammate sees. Default access lets
              anyone signed in view every non-admin screen.
            </p>
          </div>
          <div className="grid w-full max-w-md grid-cols-2 gap-2 sm:grid-cols-4">
            <HeroStat icon={UsersIcon} label="Users" value={stats.total} />
            <HeroStat icon={ShieldCheck} label="Admins" value={stats.admins} />
            <HeroStat icon={Sparkles} label="Customized" value={stats.customized} />
            <HeroStat icon={Layers} label="Screens" value={stats.screens} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-white/10 px-3 py-2 ring-1 ring-inset ring-white/15">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-0.5 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function UserRow({
  user,
  isMe,
  onAdminToggle,
  onScreenToggle,
  onReset,
}: {
  user: EffectiveUser;
  isMe: boolean;
  onAdminToggle: (next: boolean) => void;
  onScreenToggle: (screen: ScreenId) => void;
  onReset: () => void;
}) {
  const allowed = effectiveAllowed(user);
  const isAdmin = effectiveAdmin(user);
  const customized = !!user.role && !user.role.isAdmin && user.role.allowedScreens.length > 0;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm transition-colors',
        isAdmin && 'border-primary/30 bg-primary/5',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.fullName} seed={user.email || user.id} size="lg" />
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{user.fullName}</span>
              {isMe && (
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  You
                </span>
              )}
              {user.isFallback && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Pinned admin
                </span>
              )}
              {customized && (
                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Customized
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{user.email || '—'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5',
              isAdmin
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border bg-muted/30 text-muted-foreground',
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">{isAdmin ? 'Admin' : 'Standard'}</span>
            <ToggleSwitch
              size="sm"
              checked={isAdmin}
              onChange={onAdminToggle}
              disabled={user.isFallback}
              ariaLabel={`Toggle admin for ${user.fullName}`}
            />
          </div>
          {user.role && !user.isFallback && (
            <Button variant="outline" size="sm" onClick={onReset} title="Reset to default access">
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ALL_NON_ADMIN_SCREENS.map((s) => {
          const on = allowed.has(s.id);
          const disabled = isAdmin || user.isFallback;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => !disabled && onScreenToggle(s.id)}
              disabled={disabled}
              className={cn(
                'group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                on
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                  : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
                disabled && 'cursor-not-allowed opacity-60 hover:bg-muted/40',
              )}
              title={disabled ? `${s.label} (admin sees everything)` : s.label}
            >
              {on ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {s.label}
            </button>
          );
        })}
      </div>
    </motion.li>
  );
}
```

---

## Step 4 — Wire it into the router

In the target app's `App.tsx` (or wherever routes live):

```tsx
import { SettingsPage } from '@/pages/settings';

// inside <Routes>
<Route path="/settings" element={<SettingsPage />} />
```

And add a sidebar link to `/settings`. To hide it from non-admins, gate on
`useCurrentUserPermissions().hasAccess('settings')`.

---

## Notes & gotchas

- **Prefix:** every Dataverse identifier uses `cr6cd_`. If the target app's publisher
  prefix is different, do a single repo-wide find/replace of `cr6cd_` → `<yourprefix>_`.
- **Dev mock data:** in Codespaces (`isDevEnvironment === true`), `useUserRoles` starts
  with an empty in-memory array and `useSystemUsers` returns 2 hardcoded users. Edits
  persist for the session but not across reloads. Production hits Dataverse.
- **Fallback admins** in `screens.ts` always have admin access even with no row in
  `cr6cd_scproles` — this prevents permanent lockout when the table is empty. The UI
  shows them with a "Pinned admin" badge and disables their toggle.
- **Self-demotion guard:** the only remaining admin cannot demote themselves; the UI
  shows a toast instead.
- **Reset** deletes the row from `cr6cd_scproles` entirely, which puts the user back
  on default access (all non-admin screens).
