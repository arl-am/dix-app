import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../lib/utils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseDate(str: string) {
  const [y, m, d] = str.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  triggerClassName,
}: DatePickerProps) {
  const today = new Date();
  const parsed = value ? parseDate(value) : null;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const [mode, setMode] = useState<'days' | 'months' | 'years'>('days');
  const [pos, setPos] = useState<{ top: number; left: number; width: number; flipped: boolean } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight ?? 360;
    const panelWidth = Math.max(rect.width, 296);
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const flipped = spaceBelow < panelHeight && spaceAbove > spaceBelow;
    const top = flipped ? rect.top - panelHeight - gap : rect.bottom + gap;
    const left = Math.min(rect.left, window.innerWidth - panelWidth - 8);
    setPos({ top, left: Math.max(8, left), width: panelWidth, flipped });
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
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
      setMode('days');
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [open]);

  const handleSelect = (day: number) => {
    onChange(toDateStr(viewYear, viewMonth, day));
    setOpen(false);
    setMode('days');
  };

  const handleMonthSelect = (month: number) => {
    setViewMonth(month);
    setMode('days');
  };

  const handleYearSelect = (year: number) => {
    setViewYear(year);
    setMode('months');
  };

  const handleToday = () => {
    const t = new Date();
    onChange(toDateStr(t.getFullYear(), t.getMonth(), t.getDate()));
    setOpen(false);
    setMode('days');
  };

  const handleClear = () => {
    onChange('');
    setOpen(false);
    setMode('days');
  };

  const displayValue = parsed
    ? new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '';

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const yearPageStart = Math.floor(viewYear / 12) * 12;

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center w-full rounded-lg border border-input bg-background text-sm shadow-sm',
          'outline-none transition-all duration-200 cursor-pointer',
          'hover:border-muted-foreground/40',
          open
            ? 'border-primary ring-2 ring-primary/20 shadow-md'
            : 'focus:border-primary focus:ring-2 focus:ring-primary/20',
          'pl-10 pr-3 h-10',
          triggerClassName,
        )}
      >
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200">
          <Calendar className={cn('w-4 h-4', open && 'text-primary')} />
        </span>
        <span className={cn(
          'truncate text-left',
          displayValue ? 'text-foreground' : 'text-muted-foreground',
        )}>
          {displayValue || placeholder}
        </span>
      </button>

      {open && pos && createPortal(
        <div
          ref={panelRef}
          className={cn(
            'fixed z-[9999] bg-card border border-border rounded-xl shadow-xl overflow-hidden',
            pos.flipped ? 'animate-fade-in-up' : 'animate-fade-in-down',
          )}
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          <div className="p-3">
            {mode === 'days' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setViewYear(viewYear - 1)} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); }} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode('months')}
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-muted"
                  >
                    {MONTHS[viewMonth]} {viewYear}
                  </button>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); }} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setViewYear(viewYear + 1)} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 mb-1">
                  {DAYS.map((d) => (
                    <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`e-${i}`} className="h-8" />
                  ))}
                  {Array.from({ length: totalDays }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = toDateStr(viewYear, viewMonth, day);
                    const isSelected = value === dateStr;
                    const isToday = dateStr === todayStr;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleSelect(day)}
                        className={cn(
                          'h-8 w-full rounded-lg text-sm flex items-center justify-center transition-all duration-100 cursor-pointer',
                          isSelected
                            ? 'bg-primary text-white font-semibold shadow-sm'
                            : isToday
                              ? 'bg-primary/10 text-primary font-semibold hover:bg-primary/20'
                              : 'text-foreground hover:bg-muted',
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {mode === 'months' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => setViewYear(viewYear - 1)} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('years')}
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-muted"
                  >
                    {viewYear}
                  </button>
                  <button type="button" onClick={() => setViewYear(viewYear + 1)} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTHS.map((m, i) => {
                    const isCurrent = i === viewMonth && viewYear === (parsed?.year ?? -1);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleMonthSelect(i)}
                        className={cn(
                          'h-9 rounded-lg text-sm font-medium transition-all duration-100 cursor-pointer',
                          isCurrent
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-foreground hover:bg-muted',
                        )}
                      >
                        {m.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {mode === 'years' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => setViewYear(viewYear - 12)} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-foreground">
                    {yearPageStart} — {yearPageStart + 11}
                  </span>
                  <button type="button" onClick={() => setViewYear(viewYear + 12)} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const yr = yearPageStart + i;
                    const isCurrent = yr === viewYear;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => handleYearSelect(yr)}
                        className={cn(
                          'h-9 rounded-lg text-sm font-medium transition-all duration-100 cursor-pointer',
                          isCurrent
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-foreground hover:bg-muted',
                        )}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between px-3 py-2 border-t border-border">
            <button
              type="button"
              onClick={handleToday}
              className="text-xs font-medium text-primary hover:underline transition-colors cursor-pointer"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
