import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import {
  EQUIPMENT_LIFECYCLE,
  LIFECYCLE_STYLE,
} from '../../lib/cancellationConstants';
import type { CxlEquipment } from '../../lib/mockData';

const INTAKE_CHIPS: Array<{ value: number; label: string }> = [
  { value: EQUIPMENT_LIFECYCLE.NEED,        label: 'Required' },
  { value: EQUIPMENT_LIFECYCLE.NA,          label: 'Not Required' },
  { value: EQUIPMENT_LIFECYCLE.TRANSFERRED, label: 'Transferred' },
  { value: EQUIPMENT_LIFECYCLE.REACTIVATED, label: 'Reactivated' },
];

interface Props {
  item: CxlEquipment;
  onUpdate: (lifecycleState: number) => void;
  delayMs?: number;
  /** Optional inline content (PrePass #, RFID #, Plate # / Fleet, Logs date range) */
  children?: ReactNode;
}

export default function EquipmentRequirementCard({ item, onUpdate, delayMs = 0, children }: Props) {
  const state = item.cr6cd_lifecyclestate;
  const cardStyle = LIFECYCLE_STYLE[state] ?? LIFECYCLE_STYLE[EQUIPMENT_LIFECYCLE.NA];

  return (
    <div
      className={cn(
        'group relative rounded-xl border overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:shadow-md hover:-translate-y-0.5',
      )}
      style={{
        backgroundColor: cardStyle.bg,
        borderColor: cardStyle.border,
        animation: 'card-pop-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) both',
        animationDelay: `${delayMs}ms`,
      }}
    >
      <div className="p-3.5 space-y-3">
        <p className="text-sm font-bold leading-tight" style={{ color: cardStyle.text }}>
          {item.cr6cd_displayname}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {INTAKE_CHIPS.map((chip) => {
            const isActive = state === chip.value;
            const chipStyle = LIFECYCLE_STYLE[chip.value];
            return (
              <button
                key={chip.value}
                onClick={() => onUpdate(chip.value)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                  'transition-all duration-200 active:scale-[0.92]',
                  'border',
                  !isActive && 'bg-white/70 border-transparent text-slate-600 hover:bg-white hover:shadow-sm',
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

        {children && <div className="pt-2 border-t border-white/40 -mx-3.5 px-3.5">{children}</div>}
      </div>
    </div>
  );
}
