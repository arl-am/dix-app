export interface UserColor {
  bg: string;
  shadow: string;
}

const PALETTE: UserColor[] = [
  { bg: '#3B82F6', shadow: 'rgba(59, 130, 246, 0.2)' },
  { bg: '#8B5CF6', shadow: 'rgba(139, 92, 246, 0.2)' },
  { bg: '#EC4899', shadow: 'rgba(236, 72, 153, 0.2)' },
  { bg: '#F59E0B', shadow: 'rgba(245, 158, 11, 0.2)' },
  { bg: '#10B981', shadow: 'rgba(16, 185, 129, 0.2)' },
  { bg: '#06B6D4', shadow: 'rgba(6, 182, 212, 0.2)' },
  { bg: '#EF4444', shadow: 'rgba(239, 68, 68, 0.2)' },
  { bg: '#6366F1', shadow: 'rgba(99, 102, 241, 0.2)' },
  { bg: '#14B8A6', shadow: 'rgba(20, 184, 166, 0.2)' },
  { bg: '#F97316', shadow: 'rgba(249, 115, 22, 0.2)' },
];

export function colorForUser(seed: string): UserColor {
  if (!seed) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
