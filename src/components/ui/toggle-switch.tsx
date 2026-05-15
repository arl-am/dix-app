import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ToggleSwitchSize = 'sm' | 'md';

const SIZE_TRACK: Record<ToggleSwitchSize, string> = { sm: 'h-5 w-9', md: 'h-7 w-12' };
const SIZE_THUMB: Record<ToggleSwitchSize, string> = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5' };
const SIZE_THUMB_ON: Record<ToggleSwitchSize, number> = { sm: 16, md: 22 };
const SIZE_THUMB_OFF: Record<ToggleSwitchSize, number> = { sm: 2, md: 2 };

export type ToggleSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  size?: ToggleSwitchSize;
  ariaLabel?: string;
  className?: string;
};

export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  size = 'md',
  ariaLabel,
  className,
}: ToggleSwitchProps) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      className={cn(
        'group relative inline-flex shrink-0 cursor-pointer items-center rounded-full',
        'transition-[background-color,box-shadow] duration-300 ease-out',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25',
        SIZE_TRACK[size],
        checked
          ? 'bg-gradient-to-r from-primary to-blue-500 shadow-[0_2px_8px_-2px_rgba(37,99,235,0.5)]'
          : 'bg-slate-200 shadow-inner shadow-slate-300/40 dark:bg-slate-700 dark:shadow-slate-900/40',
        !disabled && !checked && 'hover:bg-slate-300 dark:hover:bg-slate-600',
        !disabled && checked && 'hover:shadow-[0_2px_12px_-1px_rgba(37,99,235,0.65)]',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset transition-colors duration-300',
          checked ? 'ring-white/20' : 'ring-black/[0.04] dark:ring-white/10',
        )}
      />
      <motion.span
        aria-hidden
        layout
        animate={{
          x: checked ? SIZE_THUMB_ON[size] : SIZE_THUMB_OFF[size],
          scale: checked ? 1.02 : 1,
        }}
        transition={{ type: 'spring', stiffness: 600, damping: 32, mass: 0.6 }}
        className={cn(
          'relative z-10 inline-flex items-center justify-center rounded-full bg-white shadow-md',
          'transition-[box-shadow] duration-200',
          SIZE_THUMB[size],
          checked
            ? 'shadow-[0_2px_6px_rgba(0,0,0,0.18)] ring-1 ring-black/5'
            : 'shadow-[0_1px_3px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]',
          !disabled && 'group-hover:shadow-[0_3px_8px_rgba(0,0,0,0.22)]',
        )}
      >
        <motion.span
          aria-hidden
          initial={false}
          animate={{ opacity: checked ? 1 : 0, scale: checked ? 1 : 0.6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={cn(
            'block rounded-full bg-gradient-to-br from-primary to-blue-500',
            size === 'sm' ? 'h-1 w-1' : 'h-1.5 w-1.5',
          )}
        />
      </motion.span>
    </motion.button>
  );
}
