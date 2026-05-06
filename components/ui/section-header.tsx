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
        'mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? <Pill tone="brand">{eyebrow}</Pill> : null}
        <h2
          className={cn(
            'font-display leading-tight',
            eyebrow && 'mt-2',
            titleTone === 'brand'
              ? 'inline-flex w-fit rounded-lg border border-brand/25 bg-brand/[0.09] px-2.5 py-1 text-lg font-semibold text-brand shadow-[0_0_24px_rgb(98_255_174_/_0.1)] sm:text-xl'
              : 'text-2xl font-bold text-foreground sm:text-3xl'
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
