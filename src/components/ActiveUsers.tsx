import { useState, useRef, useEffect } from 'react';
import { usePresenceContext, deriveInitials, type ActiveUser } from '../hooks/usePresence';
import { cn } from '../lib/utils';
import { colorForUser } from '../lib/userColor';
import { Users } from 'lucide-react';

const MAX_VISIBLE = 3;

function relativeTime(iso: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export default function ActiveUsers() {
  const { activeUsers, currentUser } = usePresenceContext();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const displayUsers = activeUsers.filter((u) => u.userId !== currentUser?.userId);
  if (displayUsers.length === 0) return null;

  const visible = displayUsers.slice(0, MAX_VISIBLE);
  const overflow = displayUsers.length - visible.length;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'group relative flex items-center h-9 rounded-full pl-1 pr-2 border transition-all duration-200 active:scale-95',
          'border-border bg-card hover:bg-accent hover:border-muted-foreground/40 hover:shadow-sm',
          open && 'bg-accent border-primary/40 shadow-sm',
        )}
        aria-label="Active users"
      >
        <div className="flex items-center -space-x-2">
          {visible.map((u) => (
            <Avatar key={u.userId} user={u} />
          ))}
          {overflow > 0 && (
            <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground relative z-0">
              +{overflow}
            </div>
          )}
        </div>
        <span className="ml-2 flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
          {displayUsers.length}
        </span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 rounded-xl border border-border bg-card shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] overflow-hidden z-50 animate-fade-in-up">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Active Now</div>
              <div className="text-[11px] text-muted-foreground">
                {displayUsers.length} {displayUsers.length === 1 ? 'person' : 'people'} online
              </div>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {displayUsers.map((u, i) => (
              <div
                key={u.userId}
                className="flex items-center gap-3 px-3 py-2 hover:bg-accent/60 transition-colors duration-150 animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Avatar user={u} withBorder={false} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{u.userName}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {relativeTime(u.lastSeen)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ user, withBorder = true, size = 'sm' }: { user: ActiveUser; withBorder?: boolean; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-[11px]';
  const palette = colorForUser(user.userId || user.userName);
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white shadow-md flex-shrink-0',
        dim,
        withBorder && 'border-2 border-card',
      )}
      style={{ backgroundColor: palette.bg, boxShadow: `0 4px 6px -1px ${palette.shadow}` }}
      title={user.userName}
    >
      {deriveInitials(user.userName)}
    </div>
  );
}
