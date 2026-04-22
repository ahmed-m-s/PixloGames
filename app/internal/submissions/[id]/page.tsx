import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InternalAccessPanel } from '@/components/internal/internal-access-panel';
import { MediaAssetsPanel } from '@/components/internal/media-assets-panel';
import { PublishingActions } from '@/components/internal/publishing-actions';
import { SubmissionReviewActions } from '@/components/internal/submission-review-actions';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { StatusBadge } from '@/components/ui/status-badge';
import { createInternalCsrfToken } from '@/lib/auth/csrf';
import { requireInternalPermission } from '@/lib/auth/session';
import { getSubmissionIntakeIssues, getSubmissionReadiness } from '@/lib/ingestion';
import { createPageMetadata } from '@/lib/metadata';
import { getSubmissionPublishingReadiness } from '@/lib/publishing';
import {
  getGameBySourceSubmissionId,
  getSubmissionById,
  listSubmissionReviews
} from '@/lib/repositories/content-repository';
import type { SubmissionStatus } from '@/types/submission';

type SubmissionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({ params }: SubmissionDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const submission = await getSubmissionById(id);

  return createPageMetadata(
    submission ? `Review ${submission.title}` : 'Submission Not Found',
    'PixloGames internal submission review workflow.',
    {
      path: `/internal/submissions/${id}`,
      noIndex: true
    }
  );
}

function statusTone(status: SubmissionStatus) {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'needs_changes') return 'warning';
  if (status === 'in_review') return 'brand';
  return 'neutral';
}

function issueTone(severity: string) {
  if (severity === 'error') return 'danger';
  if (severity === 'warning') return 'warning';
  return 'neutral';
}

function publishingTone(status?: string) {
  if (status === 'published' || status === 'draft_created') return 'success';
  if (status === 'blocked') return 'danger';
  return 'neutral';
}

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const session = await requireInternalPermission('review_submissions');
  const csrfToken = createInternalCsrfToken(session);
  const { id } = await params;
  const [submission, reviews] = await Promise.all([
    getSubmissionById(id),
    listSubmissionReviews(id)
  ]);

  if (!submission) {
    notFound();
  }

  const readiness = getSubmissionReadiness(submission);
  const issues = getSubmissionIntakeIssues(submission);
  const linkedGame = await getGameBySourceSubmissionId(submission.id);
  const publishingReadiness = getSubmissionPublishingReadiness(
    submission,
    linkedGame?.id ?? submission.publishedGameId
  );

  return (
    <main>
      <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Pill tone="brand">Submission review</Pill>
              <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
                {submission.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
                {submission.shortDescription ?? 'No short description was provided.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label={submission.status} tone={statusTone(submission.status)} />
              <StatusBadge
                label={`${readiness}% ready`}
                tone={readiness >= 80 ? 'success' : 'warning'}
              />
              <StatusBadge
                label={submission.publishingStatus ?? 'not_started'}
                tone={publishingTone(submission.publishingStatus)}
              />
              <StatusBadge label={submission.category} tone="brand" />
            </div>
          </div>
        </section>

        <InternalAccessPanel session={session} title="Submission detail access" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
              <p className="font-display text-xl font-bold text-foreground">Game metadata</p>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <Detail label="Developer" value={submission.developerName} />
                <Detail label="Publisher" value={submission.publisherName ?? 'Not provided'} />
                <Detail label="Contact" value={submission.contactEmail} />
                <Detail label="Submitted" value={submission.submittedAt} />
                <Detail label="Platforms" value={submission.supportedPlatforms.join(', ')} />
                <Detail label="Tags" value={submission.tags?.join(', ') || 'Not provided'} />
              </dl>
              <p className="mt-5 text-sm leading-6 text-muted">
                {submission.description ?? 'No full description was provided.'}
              </p>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
              <p className="font-display text-xl font-bold text-foreground">Source and assets</p>
              <dl className="mt-4 grid gap-4">
                <Detail label="Source type" value={submission.sourceType ?? 'Not provided'} />
                <LinkDetail label="Playable/package link" value={submission.buildUrl} />
                <LinkDetail label="Embed/source URL" value={submission.sourceUrl} />
                <LinkDetail label="Thumbnail URL" value={submission.thumbnailUrl} />
                <LinkDetail label="Cover URL" value={submission.coverImageUrl} />
                <LinkDetail label="Website" value={submission.websiteUrl} />
              </dl>
              <p className="mt-5 text-xs leading-5 text-muted">
                URL references remain supported. Uploaded thumbnail and cover files are shown in the
                media review panel below.
              </p>
            </section>

            <MediaAssetsPanel assets={submission.mediaAssets} />

            <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
              <p className="font-display text-xl font-bold text-foreground">Review notes</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
                {submission.reviewNotes.map((note) => (
                  <li className="rounded-lg border border-white/10 bg-black/[0.18] p-3" key={note}>
                    {note}
                  </li>
                ))}
              </ul>
              {submission.submitterNotes ? (
                <div className="mt-4 rounded-lg border border-aqua/20 bg-aqua/[0.08] p-4">
                  <p className="text-sm font-bold text-aqua">Developer notes</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{submission.submitterNotes}</p>
                </div>
              ) : null}
            </section>
          </div>

          <aside className="space-y-6">
            <SubmissionReviewActions
              csrfToken={csrfToken}
              currentStatus={submission.status}
              submissionId={submission.id}
            />

            <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
              <p className="font-display text-xl font-bold text-foreground">Publishing bridge</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Approved submissions can become internal game drafts first. Public publishing stays
                blocked until the game record passes QA and publication checks.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge
                  label={`${publishingReadiness.score}% publish ready`}
                  tone={publishingReadiness.eligible ? 'success' : 'warning'}
                />
                {linkedGame ? (
                  <StatusBadge label="game draft exists" tone="success" />
                ) : (
                  <StatusBadge label="no game record" tone="neutral" />
                )}
              </div>
              {linkedGame ? (
                <Link
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] px-4 text-sm font-bold text-foreground transition hover:border-white/20 hover:bg-white/[0.12]"
                  href="/internal/games"
                >
                  View game operations
                </Link>
              ) : (
                <PublishingActions
                  canCreateDraft={publishingReadiness.eligible}
                  compact
                  csrfToken={csrfToken}
                  submissionId={submission.id}
                />
              )}
              {publishingReadiness.issues.length > 0 ? (
                <ul className="mt-4 space-y-2 text-xs leading-5 text-muted">
                  {publishingReadiness.issues.map((issue) => (
                    <li key={`${issue.field}-${issue.message}`}>
                      {issue.severity}: {issue.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
              <p className="font-display text-xl font-bold text-foreground">Readiness signals</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {issues.length > 0 ? (
                  issues.map((issue) => (
                    <StatusBadge
                      key={`${issue.field}-${issue.message}`}
                      label={`${issue.field}: ${issue.severity}`}
                      tone={issueTone(issue.severity)}
                    />
                  ))
                ) : (
                  <StatusBadge label="No intake issues" tone="success" />
                )}
              </div>
              <ul className="mt-4 space-y-2 text-xs leading-5 text-muted">
                {issues.map((issue) => (
                  <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                ))}
              </ul>
              {submission.duplicateSignal ? (
                <p className="mt-4 text-xs leading-5 text-sun">
                  Duplicate signal: {submission.duplicateSignal}
                </p>
              ) : null}
              <p className="mt-4 text-xs leading-5 text-muted">
                Abuse score: {submission.abuseScore ?? 0}
              </p>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
              <p className="font-display text-xl font-bold text-foreground">Status history</p>
              {reviews.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {reviews.map((review) => (
                    <article
                      className="rounded-lg border border-white/10 bg-black/[0.18] p-3"
                      key={review.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={review.action} tone="neutral" />
                        <span className="text-xs font-semibold text-muted">
                          {new Date(review.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {review.note ?? 'No note supplied.'}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-muted">
                        {review.reviewerName ?? 'Internal reviewer'}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-muted">
                  No protected review actions yet.
                </p>
              )}
            </section>

            <Link
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] px-4 text-sm font-bold text-foreground transition hover:border-white/20 hover:bg-white/[0.12]"
              href="/internal/submissions"
            >
              Back to submissions
            </Link>
          </aside>
        </div>
      </PageContainer>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function LinkDetail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 break-all text-sm font-semibold text-foreground">
        {value ? (
          <a
            className="text-aqua transition hover:text-brand"
            href={value}
            rel="noreferrer"
            target="_blank"
          >
            {value}
          </a>
        ) : (
          'Not provided'
        )}
      </dd>
    </div>
  );
}
