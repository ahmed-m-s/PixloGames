import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Pill } from '@/components/ui/pill';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  titleId?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  titleId,
  description,
  action,
  className
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? <Pill tone="brand">{eyebrow}</Pill> : null}
        <h2
          className="mt-3 font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl"
          id={titleId}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
