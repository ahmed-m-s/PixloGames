import type { Metadata } from 'next';
import Link from 'next/link';
import { InternalAccessPanel } from '@/components/internal/internal-access-panel';
import { PublishingActions } from '@/components/internal/publishing-actions';
import { AdSlot } from '@/components/ui/ad-slot';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { StatusBadge } from '@/components/ui/status-badge';
import { createInternalCsrfToken } from '@/lib/auth/csrf';
import { requireInternalPermission } from '@/lib/auth/session';
import { getGameQualityReport } from '@/lib/ingestion';
import { createPageMetadata } from '@/lib/metadata';
import { getGamePublishingReadiness } from '@/lib/publishing';
import {
  listAdPlacements,
  listCollectionsForGame,
  listGames
} from '@/lib/repositories/content-repository';

export const metadata: Metadata = createPageMetadata(
  'Internal Game Operations',
  'Internal PixloGames scaffold for content QA, publishing readiness, and curation status.',
  {
    path: '/internal/games',
    noIndex: true
  }
);

function scoreTone(score: number) {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
}

function statusTone(status: string) {
  if (status === 'approved' || status === 'published' || status === 'passed') return 'success';
  if (status === 'blocked' || status === 'failed' || status === 'rejected') return 'danger';
  if (status === 'needs_changes' || status === 'flagged') return 'warning';
  return 'neutral';
}

export default async function InternalGamesPage() {
  const session = await requireInternalPermission('manage_games');
  const csrfToken = createInternalCsrfToken(session);
  const games = await listGames({ includeInternal: true });
  const reports = await Promise.all(
    games.map(async (game) => ({
      game,
      report: getGameQualityReport(game),
      publishing: getGamePublishingReadiness(game),
      collections: await listCollectionsForGame(game.id)
    }))
  );
  const homepageReady = reports.filter((item) => item.report.readyForHomepage).length;
  const sponsoredReady = reports.filter((item) => item.report.readyForSponsored).length;
  const publishedGames = games.filter(
    (game) => game.status === 'published' && game.visibility === 'public'
  ).length;
  const draftGames = games.filter(
    (game) => game.status === 'draft' || game.visibility === 'internal'
  ).length;
  const adPlacements = await listAdPlacements();

  return (
    <main>
      <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <Pill tone="brand">Internal scaffold</Pill>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
            Game Operations
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
            A backend-ready content operations view for QA status, visibility, moderation, curation,
            collections, and sponsor-safe readiness.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Total games" value={games.length} />
            <Metric label="Homepage ready" value={homepageReady} />
            <Metric label="Sponsored ready" value={sponsoredReady} />
            <Metric label="Published" value={publishedGames} />
            <Metric label="Draft/internal" value={draftGames} />
          </div>
        </section>

        <InternalAccessPanel session={session} title="Game operations access" />

        <section className="grid gap-4">
          {reports.map(({ game, report, publishing, collections }) => (
            <article
              className="rounded-lg border border-white/10 bg-white/[0.05] p-4 sm:p-5"
              key={game.id}
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={`${report.score}% complete`}
                      tone={scoreTone(report.score)}
                    />
                    <StatusBadge label={game.visibility} tone={statusTone(game.visibility)} />
                    <StatusBadge label={game.status} tone={statusTone(game.status)} />
                    <StatusBadge
                      label={game.moderationStatus}
                      tone={statusTone(game.moderationStatus)}
                    />
                    <StatusBadge label={game.qaStatus} tone={statusTone(game.qaStatus)} />
                    <StatusBadge
                      label={`${publishing.score}% publish ready`}
                      tone={publishing.eligible ? 'success' : 'warning'}
                    />
                    <StatusBadge
                      label={`${game.mediaAssets?.length ?? 0} media assets`}
                      tone={(game.mediaAssets?.length ?? 0) > 0 ? 'success' : 'neutral'}
                    />
                    {game.adSafe ? <StatusBadge label="ad safe" tone="success" /> : null}
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
                    {game.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{game.shortDescription}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {collections.map((collection) => (
                      <Link
                        className="rounded-full border border-aqua/20 bg-aqua/[0.1] px-3 py-1 text-xs font-bold text-aqua"
                        href="/internal/collections"
                        key={collection.id}
                      >
                        {collection.title}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/[0.22] p-4 text-sm">
                  <dl className="grid grid-cols-2 gap-3 text-muted">
                    <div>
                      <dt className="font-bold text-foreground">Featured</dt>
                      <dd>{game.featuredPriority}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-foreground">Sponsored</dt>
                      <dd>{game.sponsoredPriority}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-foreground">Source</dt>
                      <dd className="capitalize">{game.sourceOrigin.replaceAll('_', ' ')}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-foreground">Embed</dt>
                      <dd className="capitalize">{game.embedType.replaceAll('-', ' ')}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="font-bold text-foreground">Submission link</dt>
                      <dd className="break-all">
                        {game.sourceSubmissionId ?? 'Manual/catalog content'}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4">
                    <PublishingActions
                      canPublish={publishing.eligible}
                      compact
                      csrfToken={csrfToken}
                      gameId={game.id}
                    />
                  </div>
                  {publishing.issues.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {publishing.issues.slice(0, 3).map((issue) => (
                        <li
                          className="text-xs leading-5 text-muted"
                          key={`${issue.field}-${issue.message}`}
                        >
                          {issue.severity}: {issue.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Pill tone="brand">Ad ops</Pill>
              <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
                Monetization Placements
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Database-backed placement metadata for future ad server and sponsorship workflows.
                Public slots stay non-invasive while operations can see readiness here.
              </p>
            </div>
            <StatusBadge label={`${adPlacements.length} placements`} tone="neutral" />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {adPlacements.map((placement) => (
              <AdSlot
                enabled={placement.enabled}
                key={placement.id}
                label={placement.label}
                placement={placement.placementKey}
                showProviderState
                sponsoredOnly={placement.sponsoredOnly}
              />
            ))}
          </div>
        </section>
      </PageContainer>
    </main>
  );
}

type MetricProps = {
  label: string;
  value: number;
};

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/[0.22] p-4">
      <p className="font-display text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm font-semibold text-muted">{label}</p>
    </div>
  );
}
