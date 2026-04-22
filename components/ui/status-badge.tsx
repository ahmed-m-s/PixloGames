import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
  className?: string;
};

const toneStyles = {
  neutral: 'border-white/10 bg-white/[0.07] text-muted',
  success: 'border-brand/25 bg-brand/[0.12] text-brand',
  warning: 'border-sun/25 bg-sun/[0.12] text-sun',
  danger: 'border-ember/25 bg-ember/[0.12] text-ember',
  brand: 'border-aqua/25 bg-aqua/[0.12] text-aqua'
};

export function StatusBadge({ label, tone = 'neutral', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold capitalize',
        toneStyles[tone],
        className
      )}
    >
      {label.replaceAll('_', ' ')}
    </span>
  );
}
