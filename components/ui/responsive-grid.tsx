import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ResponsiveGridProps = HTMLAttributes<HTMLDivElement> & {
  dense?: boolean;
};

export function ResponsiveGrid({ className, dense = false, ...props }: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        dense
          ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'
          : 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3',
        className
      )}
      {...props}
    />
  );
}
