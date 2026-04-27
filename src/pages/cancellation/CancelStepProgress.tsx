import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const STEPS = [
  'Submit Request',
  'Equipment & Returns',
  'Return Address',
  'Review & Actions',
];

interface Props { current: number }

export default function CancelStepProgress({ current }: Props) {
  const progressPercent = (current / STEPS.length) * 100;
  const colCount = STEPS.length;
  // The connector line is centered behind the circles, with margins equal to
  // half a column on each side so it lines up perfectly with the first/last circle.
  const halfCol = 100 / colCount / 2;

  return (
    <div className="mb-10">
      <div className="relative">
        <div
          className="absolute left-0 right-0 top-5 h-[3px] bg-border/40 dark:bg-border/25 z-0 rounded-full"
          style={{ marginLeft: `${halfCol}%`, marginRight: `${halfCol}%` }}
        />

        <div
          className="absolute top-5 h-[3px] rounded-full z-[1]"
          style={{
            left: `${halfCol}%`,
            width: `${progressPercent}%`,
            transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            background: current > 0
              ? 'linear-gradient(90deg, #10B981 0%, #34D399 60%, #2563EB 100%)'
              : 'transparent',
          }}
        />

        {current > 0 && (
          <div
            className="absolute top-[18px] h-[7px] rounded-full z-[0] blur-[4px] opacity-50"
            style={{
              left: `${halfCol}%`,
              width: `${progressPercent}%`,
              transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              background: 'linear-gradient(90deg, #10B981 0%, #34D399 60%, #2563EB 100%)',
            }}
          />
        )}

        <div
          className="grid relative z-10"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          {STEPS.map((label, idx) => {
            const isCompleted = idx < current;
            const isActive = idx === current;
            return (
              <div key={label} className="flex flex-col items-center">
                <div className="relative">
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-full bg-[#2563EB]"
                      style={{ animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                    />
                  )}
                  <div
                    className={cn(
                      'relative w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm',
                      'transition-all duration-300 ease-out',
                      isCompleted && 'bg-[#10B981] text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]',
                      isActive && 'bg-[#2563EB] text-white shadow-[0_0_16px_rgba(37,99,235,0.45)] scale-110',
                      !isCompleted && !isActive && 'bg-card border-2 border-border/60 text-muted-foreground',
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 animate-pop" strokeWidth={2.5} />
                    ) : (
                      <span className={cn(isActive && 'tabular-nums')}>{idx + 1}</span>
                    )}
                  </div>
                </div>
                <p
                  className={cn(
                    'mt-2.5 text-xs text-center whitespace-nowrap',
                    'transition-all duration-300',
                    isCompleted && 'font-semibold text-[#10B981] dark:text-[#34D399]',
                    isActive && 'font-bold text-[#2563EB] dark:text-[#60A5FA]',
                    !isCompleted && !isActive && 'font-normal text-muted-foreground',
                  )}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
