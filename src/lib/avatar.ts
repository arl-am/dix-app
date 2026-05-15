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
