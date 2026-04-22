import { LinkButton } from '@/components/ui/button';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="surface-border rounded-lg bg-white/5 p-6 sm:p-8">
      <div className="max-w-xl">
        <p className="font-display text-xl font-bold text-foreground">{title}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        {actionLabel && actionHref ? (
          <LinkButton className="mt-5" href={actionHref} variant="secondary">
            {actionLabel}
          </LinkButton>
        ) : null}
      </div>
    </div>
  );
}
