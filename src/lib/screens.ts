import {
  type LucideIcon,
  LayoutGrid,
  Database,
  CirclePlus,
  CircleX,
  FileText,
  Settings as SettingsIcon,
} from 'lucide-react';

export type ScreenId =
  | 'dashboard'
  | 'search-records'
  | 'new-entry'
  | 'cancellations'
  | 'quick-forms'
  | 'settings';

export interface ScreenDef {
  id: ScreenId;
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const SCREENS: ScreenDef[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'KPIs and recent activity.',
    path: '/',
    icon: LayoutGrid,
  },
  {
    id: 'search-records',
    label: 'Search Records',
    description: 'Browse and search driver records.',
    path: '/drivers',
    icon: Database,
  },
  {
    id: 'new-entry',
    label: 'New Entry',
    description: 'Onboard a new driver via the wizard.',
    path: '/new-driver',
    icon: CirclePlus,
  },
  {
    id: 'cancellations',
    label: 'Cancellations',
    description: 'Track cancellation lifecycle and equipment returns.',
    path: '/cancellations',
    icon: CircleX,
  },
  {
    id: 'quick-forms',
    label: 'Quick Forms',
    description: 'Standalone document generators.',
    path: '/documents',
    icon: FileText,
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
