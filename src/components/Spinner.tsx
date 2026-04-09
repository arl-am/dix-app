import { cn } from '../lib/utils';

interface SpinnerProps {
  className?: string;
  label?: string;
}

export default function Spinner({ className, label = 'Loading...' }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 animate-fade-in', className)}>
      <div className="relative w-9 h-9">
        <div className="absolute inset-0 rounded-full border-[2.5px] border-muted" />
        <div className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-primary animate-spinner" />
      </div>
      {label && <p className="text-sm text-muted-foreground font-medium">{label}</p>}
    </div>
  );
}
