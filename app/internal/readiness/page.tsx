import type { Metadata } from 'next';
import { InternalAccessPanel } from '@/components/internal/internal-access-panel';
import { LinkButton } from '@/components/ui/button';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { StatusBadge } from '@/components/ui/status-badge';
import { requireInternalPermission } from '@/lib/auth/session';
import { createPageMetadata } from '@/lib/metadata';
import { goLiveChecklist } from '@/lib/operations/go-live';
import { getLaunchReadiness } from '@/lib/operations/readiness';
import { operationsRunbook } from '@/lib/operations/runbook';
import type { OperationalStatus } from '@/types/operations';

export const metadata: Metadata = createPageMetadata(
  'Launch Readiness',
  'Internal PixloGames launch readiness checklist for deployment, monitoring, backups, and recovery operations.',
  {
    path: '/internal/readiness',
    noIndex: true
  }
);

function statusTone(
  status: OperationalStatus
): 'neutral' | 'success' | 'warning' | 'danger' | 'brand' {
  if (status === 'ready') return 'success';
  if (status === 'blocked') return 'danger';
  return 'warning';
}

export default async function InternalReadinessPage() {
  const session = await requireInternalPermission('view_internal');
  const readiness = await getLaunchReadiness();

  return (
    <main>
      <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <Pill tone="brand">Launch operations</Pill>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
                Launch Readiness
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
                A practical checklist for deployment configuration, backups, monitoring, media,
                analytics, monetization, publishing, auth, and SEO readiness.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/[0.22] p-4">
              <StatusBadge
                label={readiness.summary.status}
                tone={statusTone(readiness.summary.status)}
              />
              <p className="mt-3 text-sm font-bold text-foreground">
                {readiness.summary.ready} ready - {readiness.summary.watch} watch -{' '}
                {readiness.summary.blocked} blocked
              </p>
              <p className="mt-1 text-xs font-semibold text-muted">
                {readiness.hostingTargetReadiness.label} -{' '}
                {readiness.productionLike ? 'production-like' : 'local/dev'}
              </p>
            </div>
          </div>
        </section>

        <InternalAccessPanel session={session} title="Launch readiness access" />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <article className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={readiness.rolloutGate.status}
                tone={
                  readiness.rolloutGate.productionReady
                    ? 'success'
                    : readiness.rolloutGate.controlledBetaReady
                      ? 'warning'
                      : 'danger'
                }
              />
              <StatusBadge label={readiness.deployment.environmentMode} tone="neutral" />
              <StatusBadge label={readiness.deployment.hostingTarget} tone="neutral" />
              <StatusBadge label={readiness.deployment.rolloutStage} tone="neutral" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-foreground">
              {readiness.rolloutGate.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Version {readiness.deployment.appVersion}
              {readiness.deployment.buildId ? `, build ${readiness.deployment.buildId}` : ''}.
              Public launch is {readiness.deployment.publicLaunchEnabled ? 'enabled' : 'disabled'}.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ReadinessMiniMetric
                label="Controlled beta"
                value={readiness.rolloutGate.controlledBetaReady ? 'Ready' : 'Blocked'}
                tone={readiness.rolloutGate.controlledBetaReady ? 'success' : 'danger'}
              />
              <ReadinessMiniMetric
                label="Production launch"
                value={readiness.rolloutGate.productionReady ? 'Ready' : 'Blocked'}
                tone={readiness.rolloutGate.productionReady ? 'success' : 'danger'}
              />
            </div>
          </article>
          <article className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
            <h2 className="font-display text-2xl font-bold text-foreground">Production Blockers</h2>
            {readiness.rolloutGate.blockers.length > 0 ? (
              <div className="mt-4 space-y-2">
                {readiness.rolloutGate.blockers.slice(0, 6).map((blocker) => (
                  <div
                    className="rounded-lg border border-ember/20 bg-ember/[0.08] p-3 text-xs leading-5 text-muted"
                    key={blocker.id}
                  >
                    <p className="font-bold text-foreground">{blocker.message}</p>
                    <p className="mt-1">{blocker.action}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-brand/20 bg-brand/[0.08] p-3 text-sm font-semibold text-brand">
                No production blockers detected.
              </p>
            )}
          </article>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Pill tone="aqua">Deployment target</Pill>
              <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
                {readiness.hostingTargetReadiness.label}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                {readiness.hostingTargetReadiness.summary}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/[0.18] p-4">
              <StatusBadge
                label={readiness.hostingTargetReadiness.status}
                tone={statusTone(readiness.hostingTargetReadiness.status)}
              />
              <p className="mt-2 text-xs font-semibold text-muted">
                {readiness.hostingTargetReadiness.deploymentClass}
              </p>
              <LinkButton className="mt-4" href="/internal/deployment" variant="secondary">
                Deployment plan
              </LinkButton>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <article className="rounded-lg border border-white/10 bg-black/[0.18] p-4">
              <h3 className="font-display text-xl font-bold text-foreground">Target Assumptions</h3>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
                {readiness.hostingTargetReadiness.assumptions.map((assumption) => (
                  <li
                    className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5"
                    key={assumption}
                  >
                    {assumption}
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-lg border border-white/10 bg-black/[0.18] p-4">
              <h3 className="font-display text-xl font-bold text-foreground">
                Recommended Next Step
              </h3>
              <p className="mt-3 rounded-lg border border-brand/20 bg-brand/[0.08] p-3 text-sm font-semibold text-brand">
                {readiness.hostingTargetReadiness.recommendedNextStep}
              </p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
                {readiness.hostingTargetReadiness.handoffGuidance.slice(0, 3).map((guidance) => (
                  <li key={guidance}>{guidance}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Deployment Artifacts
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Templates and scripts for production env packaging, process/runtime startup, and
                smoke checks.
              </p>
            </div>
            <StatusBadge
              label={`${readiness.deploymentExecutionPlan.artifacts.length} artifacts`}
              tone="brand"
            />
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-5">
            {readiness.deploymentExecutionPlan.artifacts.map((artifact) => (
              <article
                className="rounded-lg border border-white/10 bg-black/[0.18] p-4"
                key={artifact.id}
              >
                <StatusBadge
                  label={artifact.status}
                  tone={artifact.status === 'ready' ? 'success' : 'warning'}
                />
                <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                  {artifact.label}
                </h3>
                <p className="mt-2 break-words font-mono text-xs text-muted">{artifact.path}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Pill tone="brand">Final beta gate</Pill>
              <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
                Beta Release Checklist
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Last-pass checks for private beta, public beta, mutation safety, and rollback
                readiness.
              </p>
            </div>
            <StatusBadge
              label={readiness.securityReadiness.status}
              tone={statusTone(readiness.securityReadiness.status)}
            />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {readiness.betaReleaseChecklist.map((group) => (
              <article
                className="rounded-lg border border-white/10 bg-black/[0.18] p-4"
                key={group.title}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={group.status} tone={statusTone(group.status)} />
                  <StatusBadge
                    label={`${group.issues.length} issues`}
                    tone={group.issues.length > 0 ? 'warning' : 'success'}
                  />
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                  {group.title}
                </h3>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
                  {group.items.slice(0, 4).map((item) => (
                    <li
                      className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5"
                      key={item}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                {group.issues.slice(0, 2).map((issue) => (
                  <p
                    className="mt-2 rounded-lg border border-sun/20 bg-sun/[0.08] p-2.5 text-xs leading-5 text-sun"
                    key={issue.id}
                  >
                    {issue.message}
                  </p>
                ))}
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Controlled Beta Readiness
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Stage-specific readiness for private beta, public beta, and production launch.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {readiness.hostingTargetReadiness.rolloutStages.map((stage) => (
              <article
                className="rounded-lg border border-white/10 bg-black/[0.18] p-4"
                key={stage.stage}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={stage.status} tone={statusTone(stage.status)} />
                  <StatusBadge label={stage.stage} tone="neutral" />
                </div>
                <h3 className="mt-3 font-display text-xl font-bold text-foreground">
                  {stage.label}
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted">{stage.summary}</p>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
                  {stage.checks.map((check) => (
                    <li
                      className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5"
                      key={check}
                    >
                      {check}
                    </li>
                  ))}
                </ul>
                {stage.blockers.length + stage.warnings.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {[...stage.blockers, ...stage.warnings].slice(0, 3).map((issue) => (
                      <p
                        className="rounded-lg border border-sun/20 bg-sun/[0.08] p-2.5 text-xs leading-5 text-sun"
                        key={issue.id}
                      >
                        {issue.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Production Env Groups
            </h2>
            <div className="mt-4 space-y-3">
              {readiness.hostingTargetReadiness.envGroups.map((group) => (
                <div
                  className="rounded-lg border border-white/10 bg-black/[0.18] p-4"
                  key={group.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={group.status} tone={statusTone(group.status)} />
                    <StatusBadge label={group.requiredFor} tone="neutral" />
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                    {group.label}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-muted">{group.summary}</p>
                  <p className="mt-2 break-words text-xs font-semibold text-muted">
                    {group.variables.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
            <h2 className="font-display text-2xl font-bold text-foreground">Blocker Groups</h2>
            <div className="mt-4 space-y-3">
              {readiness.hostingTargetReadiness.blockerGroups.map((group) => (
                <div
                  className="rounded-lg border border-white/10 bg-black/[0.18] p-4"
                  key={group.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={`${group.blockers.length} blockers`}
                      tone={group.blockers.length > 0 ? 'danger' : 'success'}
                    />
                    <StatusBadge
                      label={`${group.warnings.length} warnings`}
                      tone={group.warnings.length > 0 ? 'warning' : 'neutral'}
                    />
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                    {group.title}
                  </h3>
                  {[...group.blockers, ...group.warnings].slice(0, 2).map((issue) => (
                    <p className="mt-2 text-xs leading-5 text-muted" key={issue.id}>
                      {issue.message}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Provider Requirements
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Deployment-target checks for active, inactive, and fallback provider modes.
              </p>
            </div>
            <LinkButton href="/internal/diagnostics" variant="secondary">
              Open diagnostics
            </LinkButton>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-4">
            {readiness.providerRequirements.map((requirement) => (
              <article
                className="rounded-lg border border-white/10 bg-black/[0.18] p-4"
                key={requirement.area}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={requirement.status}
                    tone={
                      requirement.status === 'satisfied'
                        ? 'success'
                        : requirement.status === 'blocked'
                          ? 'danger'
                          : 'warning'
                    }
                  />
                  <StatusBadge label={requirement.activationState} tone="neutral" />
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                  {requirement.label}
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted">{requirement.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {readiness.items.map((item) => (
            <article
              className="rounded-lg border border-white/10 bg-white/[0.05] p-5"
              key={item.area}
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={item.status} tone={statusTone(item.status)} />
                <StatusBadge label={item.area} tone="neutral" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold text-foreground">{item.label}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.summary}</p>
              <ul className="mt-4 space-y-2">
                {item.checks.map((check) => (
                  <li
                    className="rounded-lg border border-white/10 bg-black/[0.18] p-2.5 text-xs leading-5 text-muted"
                    key={check}
                  >
                    {check}
                  </li>
                ))}
              </ul>
              {item.issues.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {item.issues.map((issue) => (
                    <div
                      className="rounded-lg border border-sun/20 bg-sun/[0.08] p-3 text-xs leading-5 text-muted"
                      key={issue.id}
                    >
                      <p className="font-bold text-foreground">{issue.message}</p>
                      <p className="mt-1">{issue.action}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <Pill tone="sun">Go-live checklist</Pill>
          <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
            Controlled Rollout Steps
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Concise operator guidance for preparing a beta, production launch, and rollback path.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {goLiveChecklist.map((group) => (
              <article
                className="rounded-lg border border-white/10 bg-black/[0.18] p-4"
                key={group.title}
              >
                <h3 className="font-display text-xl font-bold text-foreground">{group.title}</h3>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Pill tone="aqua">Recovery runbook</Pill>
              <h2 className="mt-3 font-display text-2xl font-bold text-foreground">
                Operator Notes
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Short recovery prompts for the problems most likely to matter near launch.
              </p>
            </div>
            <LinkButton href="/internal/diagnostics" variant="secondary">
              Open diagnostics
            </LinkButton>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {operationsRunbook.map((entry) => (
              <article
                className="rounded-lg border border-white/10 bg-black/[0.18] p-4"
                key={entry.area}
              >
                <h3 className="font-display text-xl font-bold text-foreground">{entry.area}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                  {entry.checks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <p className="text-xs leading-5 text-muted">
          Generated at {new Date(readiness.generatedAt).toLocaleString()}. This page is an
          operations scaffold, not a substitute for external monitoring, managed database backups,
          or incident response tooling.
        </p>
      </PageContainer>
    </main>
  );
}

function ReadinessMiniMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: 'success' | 'danger';
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/[0.18] p-3">
      <StatusBadge label={value} tone={tone} />
      <p className="mt-2 text-xs font-semibold text-muted">{label}</p>
    </div>
  );
}
