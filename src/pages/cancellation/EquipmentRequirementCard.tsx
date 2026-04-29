import { type ReactNode } from 'react';
import { ArrowRightLeft, RotateCcw, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EQUIPMENT_LIFECYCLE } from '../../lib/cancellationConstants';
import type { CxlEquipment } from '../../lib/mockData';

const REQUIRED_DOT = '#F59E0B';
const NA_DOT = '#94A3B8';
const TRANSFER_COLOR = '#8B5CF6';
const REACTIVATE_COLOR = '#0EA5E9';

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
  const isRequired = item.cr6cd_lifecyclestate === EQUIPMENT_LIFECYCLE.NEED;
  const isTransferred = !!item.cr6cd_istransferred;
  const isReactivated = !!item.cr6cd_isreactivated;

  return (
    <div
      className={cn(
        'group relative rounded-2xl border overflow-hidden',
        'transition-all duration-500 ease-out hover:-translate-y-0.5',
        isRequired
          ? 'bg-gradient-to-br from-[#FFFAF3] to-[#FFEFDC] border-orange-200 hover:border-orange-300 hover:shadow-[0_10px_28px_-10px_rgba(249,115,22,0.32)] dark:from-orange-950/40 dark:to-orange-950/15 dark:border-orange-900/40'
          : 'bg-card border-border/80 hover:border-foreground/15 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)]',
      )}
      style={{
        animation: 'card-pop-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) both',
        animationDelay: `${delayMs}ms`,
      }}
    >
      <div className="p-4 space-y-3.5">
        <p className="text-sm font-bold leading-snug text-foreground break-words tracking-tight">
          {item.cr6cd_displayname}
        </p>

        <div
          className={cn(
            'relative grid grid-cols-2 rounded-xl p-1 h-9 isolate transition-colors duration-500',
            isRequired ? 'bg-orange-200/45 dark:bg-orange-950/40' : 'bg-muted/70',
          )}
        >
          <span
            aria-hidden
            className="absolute top-1 bottom-1 rounded-lg bg-card transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              left: isRequired ? '4px' : '50%',
              right: isRequired ? '50%' : '4px',
              boxShadow: '0 1px 2px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.08)',
            }}
          />
          <button
            type="button"
            onClick={() => !isRequired && onPrimaryChange(EQUIPMENT_LIFECYCLE.NEED)}
            className={cn(
              'relative z-10 inline-flex items-center justify-center gap-1.5 text-xs font-semibold tracking-tight',
              'transition-colors duration-200 active:scale-[0.97]',
              isRequired ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80',
            )}
          >
            <span
              className={cn('w-1.5 h-1.5 rounded-full transition-all duration-200', !isRequired && 'opacity-0 scale-50')}
              style={{ backgroundColor: REQUIRED_DOT, boxShadow: isRequired ? `0 0 0 3px ${REQUIRED_DOT}25` : undefined }}
            />
            Required
          </button>
          <button
            type="button"
            onClick={() => isRequired && onPrimaryChange(EQUIPMENT_LIFECYCLE.NA)}
            className={cn(
              'relative z-10 inline-flex items-center justify-center gap-1.5 text-xs font-semibold tracking-tight',
              'transition-colors duration-200 active:scale-[0.97]',
              !isRequired ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80',
            )}
          >
            <span
              className={cn('w-1.5 h-1.5 rounded-full transition-all duration-200', isRequired && 'opacity-0 scale-50')}
              style={{ backgroundColor: NA_DOT, boxShadow: !isRequired ? `0 0 0 3px ${NA_DOT}25` : undefined }}
            />
            Not Required
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FlagChip
            icon={ArrowRightLeft}
            label="Transferred"
            color={TRANSFER_COLOR}
            isOn={isTransferred}
            onClick={() => onQualifierToggle('transferred', !isTransferred)}
          />
          <FlagChip
            icon={RotateCcw}
            label="Reactivated"
            color={REACTIVATE_COLOR}
            isOn={isReactivated}
            onClick={() => onQualifierToggle('reactivated', !isReactivated)}
          />
        </div>

        {children && (
          <div className={cn(
            'pt-3 border-t -mx-4 px-4 transition-colors duration-500',
            isRequired ? 'border-orange-200/60 dark:border-orange-900/30' : 'border-border/60',
          )}>{children}</div>
        )}
      </div>
    </div>
  );
}

interface FlagChipProps {
  icon: typeof ArrowRightLeft;
  label: string;
  color: string;
  isOn: boolean;
  onClick: () => void;
}

function FlagChip({ icon: Icon, label, color, isOn, onClick }: FlagChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center gap-1.5 rounded-lg h-8 text-[11px] font-semibold tracking-tight',
        'transition-all duration-300 ease-out active:scale-[0.95]',
        !isOn && 'border border-border bg-card/70 backdrop-blur-sm text-muted-foreground hover:border-foreground/20 hover:text-foreground hover:bg-card',
      )}
      style={isOn ? {
        backgroundColor: color,
        color: '#fff',
        boxShadow: `0 1px 2px ${color}40, 0 6px 16px ${color}38`,
      } : undefined}
    >
      <span className="relative w-3.5 h-3.5 inline-flex items-center justify-center">
        <Icon
          className={cn(
            'absolute w-3.5 h-3.5 transition-all duration-300 ease-out',
            isOn ? 'opacity-0 -rotate-45 scale-75' : 'opacity-100 rotate-0 scale-100',
          )}
          strokeWidth={2.4}
        />
        <Check
          className={cn(
            'absolute w-3.5 h-3.5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            isOn ? 'opacity-100 rotate-0 scale-110' : 'opacity-0 rotate-45 scale-50',
          )}
          strokeWidth={3.2}
        />
      </span>
      {label}
    </button>
  );
}
