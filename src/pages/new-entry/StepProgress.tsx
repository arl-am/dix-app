import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const STEPS = [
  'Setup',
  'Record Details',
  'Testing & Compliance',
  'Transfers & Reactivation',
  'Deductions',
  'Review & Actions',
];

interface StepProgressProps {
  current: number;
}

export default function StepProgress({ current }: StepProgressProps) {
  const progressWidth = current > 0 ? `calc(${((current) / (STEPS.length - 1)) * 100}% - 8.33333%)` : '0%';

  return (
    <div className="mb-10">
      <div className="relative">
        <div
          className="absolute left-0 right-0 top-5 h-0.5 bg-border/60 z-0 rounded-full"
          style={{ marginLeft: 'calc(8.33333%)', marginRight: 'calc(8.33333%)' }}
        />
        <div
          className="absolute top-5 h-0.5 bg-gradient-to-r from-[#10B981] to-[#10B981] z-0 rounded-full"
          style={{
            left: 'calc(8.33333%)',
            width: progressWidth,
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <div className="grid grid-cols-6 relative z-10">
          {STEPS.map((label, idx) => {
            const isCompleted = idx < current;
            const isActive = idx === current;
            return (
              <div key={label} className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm',
                    'transition-all duration-200 ease-out',
                    isCompleted && 'bg-[#10B981] text-white shadow-md shadow-emerald-500/25',
                    isActive && 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30 scale-110',
                    !isCompleted && !isActive && 'bg-muted border border-border text-muted-foreground',
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 animate-pop" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <p
                  className={cn(
                    'mt-2 text-xs text-center whitespace-nowrap',
                    'transition-all duration-200',
                    isCompleted && 'font-medium text-foreground',
                    isActive && 'font-bold text-foreground',
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
