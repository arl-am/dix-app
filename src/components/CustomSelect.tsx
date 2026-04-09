import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: ReactNode;
  triggerClassName?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className,
  icon,
  triggerClassName,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState<{ top: number; left: number; width: number; flipped: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || '';
  const showSearch = options.length > 6;

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight ?? 260;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const flipped = spaceBelow < panelHeight && spaceAbove > spaceBelow;
    const top = flipped ? rect.top - panelHeight - gap : rect.bottom + gap;
    const left = Math.min(rect.left, window.innerWidth - Math.max(rect.width, 180) - 8);
    setPos({ top, left: Math.max(8, left), width: rect.width, flipped });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) return;
      setOpen(false);
      setSearch('');
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && showSearch) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open, showSearch]);

  useEffect(() => {
    if (open && value && listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ block: 'nearest' });
    }
  }, [open, value]);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setSearch('');
    }
  };

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpen(!open); setSearch(''); }}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center w-full rounded-lg border border-input bg-background text-sm shadow-sm',
          'outline-none transition-all duration-200 cursor-pointer',
          'hover:border-muted-foreground/40',
          open
            ? 'border-primary ring-2 ring-primary/20 shadow-md'
            : 'focus:border-primary focus:ring-2 focus:ring-primary/20',
          icon ? 'pl-10' : 'pl-3',
          'pr-9 h-10',
          triggerClassName,
        )}
      >
        {icon && (
          <span className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200',
            open && 'text-primary',
          )}>
            {icon}
          </span>
        )}
        <span className={cn(
          'truncate text-left',
          selectedLabel ? 'text-foreground' : 'text-muted-foreground',
        )}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform duration-200',
          open && 'rotate-180 text-primary',
        )} />
      </button>

      {open && pos && createPortal(
        <div
          ref={panelRef}
          onKeyDown={handleKeyDown}
          className={cn(
            'fixed z-[9999] bg-card border border-border rounded-xl shadow-xl overflow-hidden',
            pos.flipped ? 'animate-fade-in-up' : 'animate-fade-in-down',
          )}
          style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 180) }}
        >
          {showSearch && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}
          <div ref={listRef} className="max-h-[220px] overflow-y-auto py-1 overscroll-contain">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-sm text-muted-foreground text-center">No results found</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-active={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm text-left',
                      'transition-colors duration-100 cursor-pointer',
                      isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-muted/80',
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
