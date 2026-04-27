import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import {
  EQUIPMENT_LIFECYCLE,
  LIFECYCLE_STYLE,
} from '../../lib/cancellationConstants';
import type { CxlEquipment } from '../../lib/mockData';

const PRIMARY_CHIPS: Array<{ value: number; label: string }> = [
  { value: EQUIPMENT_LIFECYCLE.NEED, label: 'Required' },
  { value: EQUIPMENT_LIFECYCLE.NA,   label: 'Not Required' },
];

const QUALIFIER_CHIPS = [
  { key: 'transferred', label: 'Transferred', state: EQUIPMENT_LIFECYCLE.TRANSFERRED },
  { key: 'reactivated', label: 'Reactivated', state: EQUIPMENT_LIFECYCLE.REACTIVATED },
] as const;

interface Props {
  item: CxlEquipment;
  onPrimaryChange: (lifecycleState: number) => void;
  onQualifierToggle: (key: 'transferred' | 'reactivated', value: boolean) => void;
  delayMs?: number;
  /** Optional inline content (PrePass #, RFID #, Plate # / Fleet, Logs date range) */
  children?: ReactNode;
}

export default function EquipmentRequirementCard({
  item,
  onPrimaryChange,
  onQualifierToggle,
  delayMs = 0,
  children,
}: Props) {
  const state = item.cr6cd_lifecyclestate;
  const isTransferred = !!item.cr6cd_istransferred;
  const isReactivated = !!item.cr6cd_isreactivated;

  return (
    <div
      className="group relative rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5 hover:border-foreground/15"
      style={{
        animation: 'card-pop-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) both',
        animationDelay: `${delayMs}ms`,
      }}
    >
      <div className="p-3.5 space-y-3">
        <p className="text-sm font-bold leading-snug text-foreground break-words">
          {item.cr6cd_displayname}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {PRIMARY_CHIPS.map((chip) => {
            const isActive = state === chip.value;
            const chipStyle = LIFECYCLE_STYLE[chip.value];
            return (
              <button
                key={chip.value}
                onClick={() => onPrimaryChange(chip.value)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border',
                  'transition-all duration-200 active:scale-[0.92]',
                  !isActive && 'bg-white border-border text-slate-600 hover:border-slate-400 hover:shadow-sm',
                )}
                style={isActive ? {
                  backgroundColor: chipStyle.dot,
                  color: '#fff',
                  borderColor: chipStyle.dot,
                  boxShadow: `0 4px 12px ${chipStyle.dot}40`,
                } : undefined}
              >
                {isActive && <span className="w-1 h-1 rounded-full bg-white/90" />}
                {chip.label}
              </button>
            );
          })}

          {QUALIFIER_CHIPS.map((chip) => {
            const isActive = chip.key === 'transferred' ? isTransferred : isReactivated;
            const chipStyle = LIFECYCLE_STYLE[chip.state];
            return (
              <button
                key={chip.key}
                onClick={() => onQualifierToggle(chip.key, !isActive)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border',
                  'transition-all duration-200 active:scale-[0.92]',
                  !isActive && 'bg-white border-border text-slate-600 hover:border-slate-400 hover:shadow-sm',
                )}
                style={isActive ? {
                  backgroundColor: chipStyle.dot,
                  color: '#fff',
                  borderColor: chipStyle.dot,
                  boxShadow: `0 4px 12px ${chipStyle.dot}40`,
                } : undefined}
              >
                {isActive && <span className="w-1 h-1 rounded-full bg-white/90" />}
                {chip.label}
              </button>
            );
          })}
        </div>

        {children && <div className="pt-2 border-t border-border/60 -mx-3.5 px-3.5">{children}</div>}
      </div>
    </div>
  );
}
