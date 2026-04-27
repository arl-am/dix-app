import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Clock, Pencil } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import {
  EQUIPMENT_LIFECYCLE,
  EQUIPMENT_LIFECYCLE_LABELS,
  EQUIPMENT_LIFECYCLE_OPTIONS,
  LIFECYCLE_STYLE,
} from '../../lib/cancellationConstants';
import type { CxlEquipment } from '../../lib/mockData';

interface Props {
  item: CxlEquipment;
  onUpdate: (patch: Partial<{ lifecycleState: number; returneddate: string; notes: string }>) => void;
  delayMs?: number;
}

export default function EquipmentCard({ item, onUpdate, delayMs = 0 }: Props) {
  const state = item.cr6cd_lifecyclestate;
  const style = LIFECYCLE_STYLE[state] ?? LIFECYCLE_STYLE[EQUIPMENT_LIFECYCLE.NA];
  const label = EQUIPMENT_LIFECYCLE_LABELS[state];
  const isReturned = state === EQUIPMENT_LIFECYCLE.RETURNED;
  const isNeed = state === EQUIPMENT_LIFECYCLE.NEED;
  const isNa = state === EQUIPMENT_LIFECYCLE.NA;

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [justReturned, setJustReturned] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paletteOpen) return;
    const handler = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setPaletteOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [paletteOpen]);

  const handleQuickReturn = () => {
    setJustReturned(true);
    onUpdate({ lifecycleState: EQUIPMENT_LIFECYCLE.RETURNED });
    setTimeout(() => setJustReturned(false), 700);
  };

  const handlePalettePick = (newState: number) => {
    setPaletteOpen(false);
    onUpdate({ lifecycleState: newState });
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl border overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:shadow-md hover:-translate-y-0.5',
        isNa && 'opacity-70',
        justReturned && 'animate-success-ring',
      )}
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        animation: `card-pop-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) both`,
        animationDelay: `${delayMs}ms`,
      }}
    >
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate" style={{ color: style.text }}>
              {item.cr6cd_displayname}
            </p>
            <span
              className="inline-flex items-center gap-1 mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: 'rgba(255,255,255,0.7)', color: style.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
              {isReturned && <Check className="w-3 h-3 animate-check-pop" style={{ color: style.dot }} />}
              {label}
            </span>
          </div>
          <div className="relative" ref={paletteRef}>
            <button
              onClick={() => setPaletteOpen((v) => !v)}
              className={cn(
                'inline-flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200',
                'hover:bg-black/5 active:scale-90',
                paletteOpen && 'bg-black/10',
              )}
              style={{ color: style.text }}
              aria-label="Change state"
            >
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', paletteOpen && 'rotate-180')} />
            </button>
            {paletteOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-fade-in-down">
                {EQUIPMENT_LIFECYCLE_OPTIONS.map((opt) => {
                  const isCurrent = opt.value === state;
                  const optStyle = LIFECYCLE_STYLE[opt.value];
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handlePalettePick(opt.value)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors duration-150',
                        isCurrent ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted/60',
                      )}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: optStyle.dot }} />
                      {opt.label}
                      {isCurrent && <Check className="w-3 h-3 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {isReturned ? (
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1" style={{ color: style.text }}>
              <Clock className="w-3 h-3" />
              {item.cr6cd_returneddate ? formatDate(item.cr6cd_returneddate) : 'Today'}
            </span>
            <button
              onClick={() => {
                const date = window.prompt('Returned date (YYYY-MM-DD)', item.cr6cd_returneddate || new Date().toISOString().slice(0, 10));
                if (date != null) onUpdate({ returneddate: date });
              }}
              className="inline-flex items-center gap-1 text-[11px] opacity-70 hover:opacity-100 transition-opacity duration-150"
              style={{ color: style.text }}
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          </div>
        ) : isNeed ? (
          <button
            onClick={handleQuickReturn}
            className="w-full mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold h-8 px-3 bg-[#10B981] text-white shadow-sm transition-all duration-200 hover:bg-[#059669] hover:shadow-md hover:shadow-emerald-500/25 active:scale-[0.97]"
          >
            <Check className="w-3.5 h-3.5" /> Mark Returned
          </button>
        ) : isNa ? (
          <button
            onClick={() => onUpdate({ lifecycleState: EQUIPMENT_LIFECYCLE.NEED })}
            className="w-full mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium h-8 px-3 bg-white/60 hover:bg-white transition-all duration-200 active:scale-[0.97]"
            style={{ color: style.text, border: `1px solid ${style.border}` }}
          >
            Mark Required
          </button>
        ) : (
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium h-8 px-3 bg-white/60 hover:bg-white transition-all duration-200 active:scale-[0.97]"
            style={{ color: style.text, border: `1px solid ${style.border}` }}
          >
            Change…
          </button>
        )}
      </div>
    </div>
  );
}
