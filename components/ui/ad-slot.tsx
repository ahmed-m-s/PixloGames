import { getAdSlotOperationalState } from '@/lib/ads/provider';
import { cn } from '@/lib/utils';
import type { AdPlacementKey } from '@/types/ad';

type AdSlotProps = {
  placement: AdPlacementKey;
  label?: string;
  enabled?: boolean;
  sponsoredOnly?: boolean;
  showProviderState?: boolean;
  className?: string;
};

const placementCopy: Record<
  AdPlacementKey,
  { eyebrow: string; title: string; description: string }
> = {
  'homepage-inline': {
    eyebrow: 'Sponsored-ready',
    title: 'Featured partner slot',
    description: 'Reserved for curated campaigns that fit PixloGames discovery.'
  },
  'between-section': {
    eyebrow: 'Ad architecture',
    title: 'Contextual placement',
    description: 'A lightweight slot prepared for future ad server integration.'
  },
  'game-sidebar': {
    eyebrow: 'Sponsored-ready',
    title: 'Sidebar placement',
    description: 'Reserved for non-intrusive game page sponsorships.'
  }
};

export function AdSlot({
  placement,
  label,
  enabled = false,
  sponsoredOnly = false,
  showProviderState = false,
  className
}: AdSlotProps) {
  const copy = placementCopy[placement];
  const operationalState = getAdSlotOperationalState({ enabled, sponsoredOnly });

  return (
    <aside
      aria-label={label ?? copy.title}
      className={cn(
        'rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-muted',
        'shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)]',
        className
      )}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{copy.eyebrow}</p>
      <p className="mt-2 font-display text-lg font-bold text-foreground">{copy.title}</p>
      <p className="mt-2 leading-6">{copy.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full border border-white/10 bg-black/[0.2] px-2.5 py-1">
          {enabled ? 'enabled' : 'disabled'}
        </span>
        {sponsoredOnly ? (
          <span className="rounded-full border border-sun/25 bg-sun/[0.12] px-2.5 py-1 text-sun">
            sponsored only
          </span>
        ) : null}
        {showProviderState ? (
          <>
            <span className="rounded-full border border-aqua/25 bg-aqua/[0.1] px-2.5 py-1 text-aqua">
              {operationalState.provider}
            </span>
            <span className="rounded-full border border-white/10 bg-black/[0.2] px-2.5 py-1">
              {operationalState.label}
            </span>
          </>
        ) : null}
      </div>
    </aside>
  );
}
