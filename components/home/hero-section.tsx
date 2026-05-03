import { LinkButton } from '@/components/ui/button';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';

type HeroSectionProps = {
  originalCount: number;
  playableCount: number;
};

export function HeroSection({ originalCount, playableCount }: HeroSectionProps) {
  return (
    <section className="border-b border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255_/_0.05),transparent)] py-6 sm:py-7 lg:py-8">
      <PageContainer>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] lg:items-end">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Pill tone="brand">Instant play</Pill>
              <Pill tone="aqua">No downloads</Pill>
              <Pill tone="sun">Mobile friendly</Pill>
            </div>
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Play free browser games instantly
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              No downloads. No login. Just quick, fun games you can play on desktop or mobile.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/games" size="lg">
                Browse games
              </LinkButton>
              <LinkButton href="/originals" size="lg" variant="secondary">
                Pixlo Originals
              </LinkButton>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3 sm:p-4">
            <div>
              <dt className="text-xs font-semibold text-muted">Playable</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-foreground">
                {playableCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted">Originals</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-foreground">
                {originalCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted">Installs</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-foreground">0</dd>
            </div>
          </dl>
        </div>
      </PageContainer>
    </section>
  );
}
