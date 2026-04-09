import { cn } from '../lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  color?: 'primary' | 'emerald' | 'orange';
  scale?: boolean;
}

export default function Toggle({ checked, onChange, disabled, color = 'primary', scale }: ToggleProps) {
  const bgChecked = {
    primary: 'bg-[#2563EB] shadow-md shadow-primary/25',
    emerald: 'bg-emerald-500 shadow-md shadow-emerald-500/25',
    orange: 'bg-orange-500 shadow-md shadow-orange-500/25',
  }[color];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-sm outline-none',
        'transition-all duration-200 ease-out',
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? bgChecked : 'bg-input',
        scale && 'scale-110',
      )}
    >
      <span
        className={cn(
          'pointer-events-none block size-4 rounded-full bg-background ring-0',
          'transition-all duration-200 ease-out',
          checked ? 'translate-x-[calc(100%-2px)] shadow-sm' : 'translate-x-0',
        )}
      />
    </button>
  );
}
