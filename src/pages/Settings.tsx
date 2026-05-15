import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
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
  useRolesTableReady,
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

export default function SettingsPage() {
  useCurrentUser();
  const perms = useCurrentUserPermissions();
  const usersQ = useSystemUsers();
  const rolesQ = useUserRoles();
  const upsert = useUpsertRole();
  const del = useDeleteRole();
  const rolesReady = useRolesTableReady().data ?? true;
  const { confirm, dialogNode } = useConfirmDialog();

  if (!perms.ready) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }
  if (!perms.hasAccess('settings')) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Settings is admin-only</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask an admin if you need access.
          </p>
        </Card>
      </div>
    );
  }

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
    <div className="p-6">
      <PageMotion>
        <SettingsHero stats={stats} />

        {!rolesReady && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="space-y-0.5">
              <div className="font-semibold">Role table not provisioned yet</div>
              <div className="text-[13px] text-amber-800/90 dark:text-amber-200/90">
                You can browse tenant users, but adding/editing roles won't persist. Run
                <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 text-[11px] font-mono text-amber-900 dark:bg-amber-500/20 dark:text-amber-100">scripts/create-roles-table.ps1</code>,
                then register the data source with
                <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 text-[11px] font-mono text-amber-900 dark:bg-amber-500/20 dark:text-amber-100">npx power-apps add-data-source --resource-name cr6cd_scprole</code>,
                then redeploy.
              </div>
            </div>
          </div>
        )}

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
                <Button
                  size="sm"
                  onClick={() => setAddOpen(true)}
                  disabled={!rolesReady}
                  title={!rolesReady ? 'Provision the role table first' : undefined}
                >
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
    </div>
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
    <Card className="overflow-hidden relative">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-[#2563EB]" />
      <div className="p-6 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563EB]">
            <Sparkles className="h-3.5 w-3.5" />
            Access control
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Promote admins and curate which screens each teammate sees. Default access lets
            anyone signed in view every non-admin screen.
          </p>
        </div>
        <div className="grid w-full max-w-md grid-cols-2 gap-2 sm:grid-cols-4">
          <HeroStat icon={UsersIcon}     label="Users"      value={stats.total}      accent="#3B82F6" />
          <HeroStat icon={ShieldCheck}   label="Admins"     value={stats.admins}     accent="#10B981" />
          <HeroStat icon={Sparkles}      label="Customized" value={stats.customized} accent="#8B5CF6" />
          <HeroStat icon={Layers}        label="Screens"    value={stats.screens}    accent="#F59E0B" />
        </div>
      </div>
    </Card>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof UsersIcon;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" style={{ color: accent }} />
        {label}
      </div>
      <div className="mt-0.5 text-xl font-bold tabular-nums text-foreground">{value}</div>
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
