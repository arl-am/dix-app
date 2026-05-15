import { type ReactNode } from 'react';
import { Check } from 'lucide-react';
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
        isRequired ? 'eq-required-card' : 'bg-card border-border/80 hover:border-foreground/15 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)]',
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
            isRequired ? 'eq-required-track' : 'bg-muted/70',
          )}
        >
          <span
            aria-hidden
            className={cn(
              'absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
              isRequired ? 'eq-required-pill' : 'bg-card',
            )}
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
              isRequired ? 'eq-text-active' : 'text-muted-foreground hover:text-foreground/80',
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
              !isRequired ? 'text-foreground' : 'eq-text-inactive',
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
          <CheckOption
            label="Transferred"
            color={TRANSFER_COLOR}
            isOn={isTransferred}
            disabled={!isRequired}
            onClick={() => onQualifierToggle('transferred', !isTransferred)}
          />
          <CheckOption
            label="Reactivated"
            color={REACTIVATE_COLOR}
            isOn={isReactivated}
            disabled={!isRequired}
            onClick={() => onQualifierToggle('reactivated', !isReactivated)}
          />
        </div>

        {children && (
          <div className={cn(
            'pt-3 border-t -mx-4 px-4 transition-colors duration-500',
            isRequired ? 'eq-required-content-border' : 'border-border/60',
          )}>{children}</div>
        )}
      </div>
    </div>
  );
}

interface CheckOptionProps {
  label: string;
  color: string;
  isOn: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function CheckOption({ label, color, isOn, disabled, onClick }: CheckOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isOn}
      className={cn(
        'group/check relative inline-flex items-center justify-start gap-2 rounded-lg h-9 px-2.5 text-[11px] font-semibold tracking-tight border',
        'transition-all duration-200 ease-out active:scale-[0.97]',
        disabled
          ? 'border-border/60 bg-muted/30 text-muted-foreground/60 cursor-not-allowed opacity-60'
          : isOn
            ? 'bg-card border-transparent text-foreground'
            : 'border-border bg-card/70 text-muted-foreground hover:border-foreground/20 hover:text-foreground hover:bg-card',
      )}
      style={isOn && !disabled ? {
        borderColor: color,
        boxShadow: `inset 0 0 0 1px ${color}, 0 1px 2px ${color}25`,
      } : undefined}
    >
      <span
        aria-hidden
        className={cn(
          'inline-flex items-center justify-center w-4 h-4 rounded border-2 flex-shrink-0 transition-all duration-150',
        )}
        style={{
          borderColor: disabled ? '#CBD5E1' : (isOn ? color : '#CBD5E1'),
          backgroundColor: isOn && !disabled ? color : 'transparent',
        }}
      >
        <Check
          className={cn(
            'w-3 h-3 text-white transition-all duration-150',
            isOn && !disabled ? 'opacity-100 scale-100' : 'opacity-0 scale-50',
          )}
          strokeWidth={3.5}
        />
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}
