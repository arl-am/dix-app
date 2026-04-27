import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Clock, Pencil } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import {
  EQUIPMENT_LIFECYCLE,
  EQUIPMENT_LIFECYCLE_LABELS,
  LIFECYCLE_STYLE,
  TRACKING_PRIMARY_STATES,
  TRACKING_QUALIFIERS,
} from '../../lib/cancellationConstants';
import type { CxlEquipment } from '../../lib/mockData';

type Patch = {
  lifecycleState?: number;
  returneddate?: string;
  notes?: string;
  istransferred?: boolean;
  isreactivated?: boolean;
};

interface Props {
  item: CxlEquipment;
  onUpdate: (patch: Patch) => void;
  delayMs?: number;
}

export default function EquipmentCard({ item, onUpdate, delayMs = 0 }: Props) {
  const state = item.cr6cd_lifecyclestate;
  const isTransferred = !!item.cr6cd_istransferred;
  const isReactivated = !!item.cr6cd_isreactivated;
  const primaryStyle = LIFECYCLE_STYLE[state] ?? LIFECYCLE_STYLE[EQUIPMENT_LIFECYCLE.NA];
  const primaryLabel = EQUIPMENT_LIFECYCLE_LABELS[state] || '—';
  const isReturned = state === EQUIPMENT_LIFECYCLE.RETURNED;

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [palettePos, setPalettePos] = useState<{ left: number; top: number; width: number } | null>(null);
  const [justReturned, setJustReturned] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!paletteOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const PALETTE_W = 240;
    const PALETTE_H = 380;
    const margin = 8;
    let left = rect.left + rect.width / 2 - PALETTE_W / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - PALETTE_W - margin));
    let top = rect.bottom + 6;
    if (top + PALETTE_H > window.innerHeight - margin) {
      top = rect.top - PALETTE_H - 6;
    }
    setPalettePos({ left, top, width: PALETTE_W });
  }, [paletteOpen]);

  useEffect(() => {
    if (!paletteOpen) return;
    const close = (e: MouseEvent) => {
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) return;
      const popoverEl = document.getElementById('equipment-palette-popover');
      if (popoverEl && popoverEl.contains(e.target as Node)) return;
      setPaletteOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setPaletteOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onEsc);
    };
  }, [paletteOpen]);

  const handlePrimaryPick = (newState: number) => {
    if (newState === EQUIPMENT_LIFECYCLE.RETURNED && state !== EQUIPMENT_LIFECYCLE.RETURNED) {
      setJustReturned(true);
      setTimeout(() => setJustReturned(false), 700);
    }
    const patch: Patch = { lifecycleState: newState };
    if (newState === EQUIPMENT_LIFECYCLE.RETURNED && !item.cr6cd_returneddate) {
      patch.returneddate = new Date().toISOString().slice(0, 10);
    }
    onUpdate(patch);
  };

  const handleQualifierToggle = (key: 'transferred' | 'reactivated') => {
    if (key === 'transferred') onUpdate({ istransferred: !isTransferred });
    else onUpdate({ isreactivated: !isReactivated });
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-border bg-card overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:shadow-md hover:-translate-y-0.5 hover:border-foreground/15',
        justReturned && 'animate-success-ring',
      )}
      style={{
        animation: 'card-pop-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) both',
        animationDelay: `${delayMs}ms`,
      }}
    >
      <div className="p-3.5 space-y-2.5">
        <p className="text-sm font-bold leading-snug text-foreground break-words">
          {item.cr6cd_displayname}
        </p>

        <div className="flex flex-wrap gap-1">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border"
            style={{
              backgroundColor: primaryStyle.bg,
              color: primaryStyle.text,
              borderColor: primaryStyle.border,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryStyle.dot }} />
            {isReturned && <Check className="w-3 h-3 animate-check-pop" style={{ color: primaryStyle.dot }} />}
            {primaryLabel}
          </span>
          {isTransferred && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border"
              style={{
                backgroundColor: LIFECYCLE_STYLE[EQUIPMENT_LIFECYCLE.TRANSFERRED].bg,
                color: LIFECYCLE_STYLE[EQUIPMENT_LIFECYCLE.TRANSFERRED].text,
                borderColor: LIFECYCLE_STYLE[EQUIPMENT_LIFECYCLE.TRANSFERRED].border,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: LIFECYCLE_STYLE[EQUIPMENT_LIFECYCLE.TRANSFERRED].dot }} />
              Transferred
            </span>
          )}
          {isReactivated && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border"
              style={{
                backgroundColor: LIFECYCLE_STYLE[EQUIPMENT_LIFECYCLE.REACTIVATED].bg,
                color: LIFECYCLE_STYLE[EQUIPMENT_LIFECYCLE.REACTIVATED].text,
                borderColor: LIFECYCLE_STYLE[EQUIPMENT_LIFECYCLE.REACTIVATED].border,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: LIFECYCLE_STYLE[EQUIPMENT_LIFECYCLE.REACTIVATED].dot }} />
              Reactivated
            </span>
          )}
        </div>

        {isReturned && (
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Clock className="w-3 h-3" />
              {item.cr6cd_returneddate ? formatDate(item.cr6cd_returneddate) : 'Today'}
            </span>
            <button
              onClick={() => {
                const date = window.prompt('Returned date (YYYY-MM-DD)', item.cr6cd_returneddate || new Date().toISOString().slice(0, 10));
                if (date != null) onUpdate({ returneddate: date });
              }}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 transition-colors duration-150"
            >
              <Pencil className="w-3 h-3" /> Edit date
            </button>
          </div>
        )}

        <button
          ref={buttonRef}
          onClick={() => setPaletteOpen((v) => !v)}
          className={cn(
            'w-full inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold h-8 px-3',
            'border border-border bg-white hover:bg-slate-50 text-slate-700',
            'shadow-sm transition-all duration-200 active:scale-[0.97]',
            paletteOpen && 'shadow-md ring-2 ring-primary/20',
          )}
        >
          Change Status
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', paletteOpen && 'rotate-180')} />
        </button>
      </div>

      {paletteOpen && palettePos && createPortal(
        <div
          id="equipment-palette-popover"
          className="fixed z-[100] bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in-down"
          style={{ left: palettePos.left, top: palettePos.top, width: palettePos.width }}
        >
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {item.cr6cd_displayname}
            </p>
          </div>
          <div className="py-1 max-h-[360px] overflow-y-auto">
            {TRACKING_PRIMARY_STATES.map((opt) => {
              const isCurrent = opt.value === state;
              const optStyle = LIFECYCLE_STYLE[opt.value];
              return (
                <button
                  key={opt.value}
                  onClick={() => { setPaletteOpen(false); handlePrimaryPick(opt.value); }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors duration-150',
                    isCurrent ? 'bg-primary/10 font-semibold' : 'hover:bg-muted/60',
                  )}
                  style={isCurrent ? { color: optStyle.text } : undefined}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: optStyle.dot, boxShadow: `0 0 0 2px ${optStyle.bg}` }}
                  />
                  <span className={isCurrent ? '' : 'text-foreground'}>{opt.label}</span>
                  {isCurrent && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: optStyle.dot }} />}
                </button>
              );
            })}
            <div className="border-t border-border my-1" />
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Qualifiers (multi-select)
            </p>
            {TRACKING_QUALIFIERS.map((q) => {
              const isOn = q.key === 'transferred' ? isTransferred : isReactivated;
              return (
                <button
                  key={q.key}
                  onClick={() => handleQualifierToggle(q.key as 'transferred' | 'reactivated')}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors duration-150',
                    'hover:bg-muted/60',
                  )}
                >
                  <span
                    className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150"
                    style={{
                      borderColor: isOn ? q.color : '#CBD5E1',
                      backgroundColor: isOn ? q.color : 'transparent',
                    }}
                  >
                    {isOn && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-foreground">{q.label}</span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
