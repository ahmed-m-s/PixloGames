import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type PillTone = 'neutral' | 'brand' | 'ember' | 'sun' | 'aqua';

const toneStyles: Record<PillTone, string> = {
  neutral: 'border-white/10 bg-white/[0.07] text-muted',
  brand: 'border-brand/25 bg-brand/[0.12] text-brand',
  ember: 'border-ember/25 bg-ember/[0.12] text-ember',
  sun: 'border-sun/25 bg-sun/[0.12] text-sun',
  aqua: 'border-aqua/25 bg-aqua/[0.12] text-aqua'
};

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: PillTone;
};

export function Pill({ className, tone = 'neutral', ...props }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-bold uppercase tracking-[0.08em]',
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}
