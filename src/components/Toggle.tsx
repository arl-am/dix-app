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
    primary: 'bg-[#2563EB] shadow-[0_0_10px_rgba(37,99,235,0.35)]',
    emerald: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.35)]',
    orange: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.35)]',
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
        'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'active:scale-90',
        checked ? bgChecked : 'bg-input',
        scale && 'scale-110',
      )}
    >
      <span
        className={cn(
          'pointer-events-none block size-4 rounded-full bg-background ring-0',
          'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          checked ? 'translate-x-[calc(100%-2px)] shadow-md' : 'translate-x-0',
        )}
      />
    </button>
  );
}
