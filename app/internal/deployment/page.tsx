import type { Metadata } from 'next';
import { InternalAccessPanel } from '@/components/internal/internal-access-panel';
import { LinkButton } from '@/components/ui/button';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { StatusBadge } from '@/components/ui/status-badge';
import { requireInternalPermission } from '@/lib/auth/session';
import { createPageMetadata } from '@/lib/metadata';
import { getLaunchReadiness } from '@/lib/operations/readiness';

export const metadata: Metadata = createPageMetadata(
  'Deployment Plan',
  'Internal PixloGames deployment artifacts, hosting setup guidance, and post-deploy smoke checks.',
  {
    path: '/internal/deployment',
    noIndex: true
  }
);

function statusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'brand' {
  if (status === 'ready') return 'success';
  if (status === 'blocked') return 'danger';
  if (status === 'template' || status === 'watch') return 'warning';
  return 'neutral';
}

export default async function InternalDeploymentPage() {
  const session = await requireInternalPermission('view_internal');
  const readiness = await getLaunchReadiness();
  const plan = readiness.deploymentExecutionPlan;

  return (
    <main>
      <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <Pill tone="brand">Deployment handoff</Pill>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
                Deployment Plan
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
                Practical artifacts, runtime commands, reverse proxy notes, and smoke checks for
                taking PixloGames from local readiness to a controlled hosted rollout.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/[0.22] p-4">
              <StatusBadge
                label={readiness.hostingTargetReadiness.status}
                tone={statusTone(readiness.hostingTargetReadiness.status)}
              />
              <p className="mt-2 text-xs font-semibold text-muted">
                {readiness.hostingTargetReadiness.label}
              </p>
            </div>
          </div>
        </section>

        <InternalAccessPanel session={session} title="Deployment access" />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <article className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <StatusBadge label={readiness.deployment.environmentMode} tone="neutral" />
              <StatusBadge label={readiness.deployment.hostingTarget} tone="neutral" />
              <StatusBadge label={readiness.deployment.rolloutStage} tone="neutral" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-foreground">Target Summary</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {readiness.hostingTargetReadiness.summary}
            </p>
            <p className="mt-4 rounded-lg border border-brand/20 bg-brand/[0.08] p-3 text-sm font-semibold text-brand">
              {readiness.hostingTargetReadiness.recommendedNextStep}
            </p>
          </article>

          <article className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
            <h2 className="font-display text-2xl font-bold text-foreground">Runtime Commands</h2>
            <div className="mt-4 space-y-3">
              {plan.commandGroups.map((group) => (
                <div
                  className="rounded-lg border border-white/10 bg-black/[0.18] p-4"
                  key={group.label}
                >
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label={group.target} tone="neutral" />
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                    {group.label}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-muted">{group.purpose}</p>
                  <ul className="mt-3 space-y-2">
                    {group.commands.map((command) => (
                      <li
                        className="break-words rounded-lg border border-white/10 bg-white/[0.04] p-2.5 font-mono text-xs text-muted"
                        key={command}
                      >
                        {command}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Deployment Artifacts
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Repo-level templates and scripts for production config, containers, process
                management, smoke tests, and operator handoff.
              </p>
            </div>
            <LinkButton href="/internal/readiness" variant="secondary">
              Open readiness
            </LinkButton>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {plan.artifacts.map((artifact) => (
              <article
                className="rounded-lg border border-white/10 bg-black/[0.18] p-4"
                key={artifact.id}
              >
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={artifact.status} tone={statusTone(artifact.status)} />
                  <StatusBadge label={artifact.kind} tone="neutral" />
                </div>
                <h3 className="mt-3 font-display text-xl font-bold text-foreground">
                  {artifact.label}
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted">{artifact.summary}</p>
                <p className="mt-3 break-words rounded-lg border border-white/10 bg-white/[0.04] p-2.5 font-mono text-xs text-muted">
                  {artifact.path}
                </p>
                {artifact.commands.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {artifact.commands.slice(0, 2).map((command) => (
                      <li className="break-words text-xs font-semibold text-muted" key={command}>
                        {command}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <DeploymentListCard title="Reverse Proxy / Domain / TLS" items={plan.reverseProxyNotes} />
          <DeploymentListCard title="Startup / Shutdown" items={plan.startupShutdownNotes} />
          <DeploymentListCard title="Post-Deploy Smoke" items={plan.postDeploySmokeChecks} />
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <h2 className="font-display text-2xl font-bold text-foreground">Launch Blocker Groups</h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-5">
            {readiness.hostingTargetReadiness.blockerGroups.map((group) => (
              <article
                className="rounded-lg border border-white/10 bg-black/[0.18] p-4"
                key={group.id}
              >
                <h3 className="font-display text-lg font-bold text-foreground">{group.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge
                    label={`${group.blockers.length} blockers`}
                    tone={group.blockers.length > 0 ? 'danger' : 'success'}
                  />
                  <StatusBadge
                    label={`${group.warnings.length} warnings`}
                    tone={group.warnings.length > 0 ? 'warning' : 'neutral'}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </PageContainer>
    </main>
  );
}

function DeploymentListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
      <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
      <ul className="mt-4 space-y-2 text-xs leading-5 text-muted">
        {items.map((item) => (
          <li className="rounded-lg border border-white/10 bg-black/[0.18] p-2.5" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
