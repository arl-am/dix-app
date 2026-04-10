import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const STEPS = [
  'Cancellation Details',
  'Equipment & Returns',
  'Final Release',
  'Review & Actions',
];

interface Props {
  current: number;
}

export default function CancelStepProgress({ current }: Props) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, idx) => {
        const isCompleted = idx < current;
        const isActive = idx === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2',
                  'transition-all duration-200 ease-out',
                  isCompleted && 'bg-[#16A34A] border-[#16A34A] text-white',
                  isActive && 'bg-[#2563EB] border-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30 scale-110',
                  !isCompleted && !isActive && 'bg-muted border-border text-muted-foreground',
                )}
              >
                {isCompleted ? <Check className="w-5 h-5 animate-pop" /> : idx + 1}
              </div>
              <p className={cn(
                'mt-2 text-xs text-center whitespace-nowrap transition-all duration-200',
                isCompleted && 'font-medium text-foreground',
                isActive && 'font-bold text-foreground',
                !isCompleted && !isActive && 'font-normal text-muted-foreground',
              )}>
                {label}
              </p>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn(
                'w-16 md:w-24 h-0.5 mx-3 mb-6 rounded-full transition-all duration-400',
                idx < current ? 'bg-[#16A34A]' : 'bg-border',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
