import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function PageMotion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('space-y-6', className)}
    >
      {children}
    </motion.div>
  );
}
