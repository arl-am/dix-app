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
