import type { Metadata } from 'next';
import Link from 'next/link';
import { InternalAccessPanel } from '@/components/internal/internal-access-panel';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { StatusBadge } from '@/components/ui/status-badge';
import { requireInternalPermission } from '@/lib/auth/session';
import { getSubmissionIntakeIssues, getSubmissionReadiness } from '@/lib/ingestion';
import { createPageMetadata } from '@/lib/metadata';
import { listSubmissions } from '@/lib/repositories/content-repository';
import type { SubmissionStatus } from '@/types/submission';

export const metadata: Metadata = createPageMetadata(
  'Internal Submission Review',
  'Internal PixloGames scaffold for developer submission review and intake lifecycle tracking.',
  {
    path: '/internal/submissions',
    noIndex: true
  }
);

const lifecycle: { status: SubmissionStatus; description: string }[] = [
  { status: 'pending', description: 'Awaiting assignment and initial checks.' },
  {
    status: 'in_review',
    description: 'Performance, controls, rights, and ad safety are being reviewed.'
  },
  { status: 'needs_changes', description: 'Developer action is required before approval.' },
  { status: 'approved', description: 'Ready for publishing workflow.' },
  { status: 'rejected', description: 'Not eligible for PixloGames in current form.' }
];

function statusTone(status: SubmissionStatus) {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'needs_changes') return 'warning';
  if (status === 'in_review') return 'brand';
  return 'neutral';
}

export default async function InternalSubmissionsPage() {
  const session = await requireInternalPermission('review_submissions');
  const gameSubmissions = await listSubmissions({ includeRuntime: true });
  const approvedUnpublished = gameSubmissions.filter(
    (submission) => submission.status === 'approved' && submission.publishingStatus !== 'published'
  ).length;
  const draftCreated = gameSubmissions.filter(
    (submission) => submission.publishingStatus === 'draft_created'
  ).length;

  return (
    <main>
      <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <Pill tone="brand">Internal scaffold</Pill>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
            Submission Review
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
            A front-end foundation for the future intake queue, review notes, readiness checks, and
            developer feedback loop.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Total submissions" value={gameSubmissions.length} />
            <Metric label="Approved unpublished" value={approvedUnpublished} />
            <Metric label="Game drafts created" value={draftCreated} />
          </div>
        </section>

        <InternalAccessPanel session={session} title="Submission review access" />

        <section className="grid gap-4 lg:grid-cols-5">
          {lifecycle.map((step) => (
            <article
              className="rounded-lg border border-white/10 bg-white/[0.05] p-4"
              key={step.status}
            >
              <StatusBadge label={step.status} tone={statusTone(step.status)} />
              <p className="mt-3 text-sm leading-6 text-muted">{step.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4">
          {gameSubmissions.map((submission) => {
            const readiness = getSubmissionReadiness(submission);

            return (
              <article
                className="rounded-lg border border-white/10 bg-white/[0.05] p-5"
                key={submission.id}
              >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={submission.status} tone={statusTone(submission.status)} />
                      <StatusBadge
                        label={`${readiness}% ready`}
                        tone={readiness >= 80 ? 'success' : 'warning'}
                      />
                      <StatusBadge
                        label={submission.publishingStatus ?? 'not_started'}
                        tone={
                          submission.publishingStatus === 'published' ||
                          submission.publishingStatus === 'draft_created'
                            ? 'success'
                            : submission.publishingStatus === 'blocked'
                              ? 'danger'
                              : 'neutral'
                        }
                      />
                      <StatusBadge label={submission.proposedEmbedType} tone="neutral" />
                      {(submission.intakeWarnings?.length ?? 0) > 0 ? (
                        <StatusBadge label="intake warnings" tone="warning" />
                      ) : null}
                    </div>
                    <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
                      {submission.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {submission.developerName} - {submission.category} - {submission.contactEmail}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {submission.shortDescription ?? 'No short description supplied yet.'}
                    </p>
                    <div className="mt-4 rounded-lg border border-white/10 bg-black/[0.18] p-4">
                      <p className="text-sm font-bold text-foreground">Review notes</p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                        {submission.reviewNotes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-bold text-black transition hover:bg-brand-strong"
                      href={`/internal/submissions/${submission.id}`}
                    >
                      Open review
                    </Link>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/[0.22] p-4">
                    <p className="text-sm font-bold text-foreground">Criteria</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {Object.entries(submission.criteria).map(([key, value]) => (
                        <StatusBadge key={key} label={key} tone={value ? 'success' : 'warning'} />
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      {getSubmissionIntakeIssues(submission)
                        .slice(0, 3)
                        .map((issue) => (
                          <p
                            className="text-xs leading-5 text-muted"
                            key={`${issue.field}-${issue.message}`}
                          >
                            {issue.severity}: {issue.message}
                          </p>
                        ))}
                    </div>
                    <p className="mt-4 text-xs leading-5 text-muted">
                      Owner: {submission.reviewOwner}. Review actions now persist through protected
                      internal API routes.
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </PageContainer>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/[0.22] p-4">
      <p className="font-display text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm font-semibold text-muted">{label}</p>
    </div>
  );
}
