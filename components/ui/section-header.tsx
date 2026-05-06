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
  titleTone?: 'default' | 'brand';
};

export function SectionHeader({
  eyebrow,
  title,
  titleId,
  description,
  action,
  className,
  titleTone = 'default'
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
          className={cn(
            'font-display text-2xl font-bold leading-tight sm:text-3xl',
            eyebrow && 'mt-3',
            titleTone === 'brand'
              ? 'text-brand [text-shadow:0_0_24px_rgb(98_255_174_/_0.22)]'
              : 'text-foreground'
          )}
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
