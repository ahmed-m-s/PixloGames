import type { Metadata } from 'next';
import { InternalAccessPanel } from '@/components/internal/internal-access-panel';
import { LinkButton } from '@/components/ui/button';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { StatusBadge } from '@/components/ui/status-badge';
import { requireInternalPermission } from '@/lib/auth/session';
import { getInternalDiagnostics } from '@/lib/diagnostics';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata(
  'Internal Diagnostics',
  'Operational diagnostics for PixloGames content, publishing, media, analytics, and configuration health.',
  {
    path: '/internal/diagnostics',
    noIndex: true
  }
);

export default async function InternalDiagnosticsPage() {
  const session = await requireInternalPermission('view_internal');
  const diagnostics = await getInternalDiagnostics();

  return (
    <main>
      <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <Pill tone="brand">Internal diagnostics</Pill>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
            Operational Health
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
            A lightweight launch-readiness view for database-backed content health, publishing queue
            pressure, media presence, analytics flow, and configuration warnings.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge label={diagnostics.environment} tone="neutral" />
            <StatusBadge
              label={`${diagnostics.warnings.length} warnings`}
              tone={diagnostics.warnings.length > 0 ? 'warning' : 'success'}
            />
          </div>
        </section>

        <InternalAccessPanel session={session} title="Diagnostics access" />

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(diagnostics.counts).map(([label, value]) => (
            <Metric key={label} label={label.replace(/([A-Z])/g, ' $1')} value={value} />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <ProviderCard
            details={[
              `Environment: ${diagnostics.deployment.environmentMode}`,
              `Target: ${diagnostics.deployment.deploymentTarget}`,
              `Hosting: ${diagnostics.deployment.hostingTarget}`,
              `Rollout: ${diagnostics.deployment.rolloutStage}`,
              `Public launch: ${diagnostics.deployment.publicLaunchEnabled ? 'enabled' : 'disabled'}`,
              `Version: ${diagnostics.deployment.appVersion}`,
              `Build: ${diagnostics.deployment.buildId ?? 'not configured'}`
            ]}
            label={diagnostics.rolloutGate.label}
            mode={diagnostics.rolloutGate.status}
            status={
              diagnostics.rolloutGate.productionReady
                ? 'ready'
                : diagnostics.rolloutGate.controlledBetaReady
                  ? 'watch'
                  : 'blocked'
            }
            title="Deployment & Rollout"
            warnings={[
              ...diagnostics.rolloutGate.blockers.map((issue) => issue.message),
              ...diagnostics.rolloutGate.warnings.map((issue) => issue.message)
            ]}
          />
          <article className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={diagnostics.rolloutGate.controlledBetaReady ? 'beta safe' : 'beta blocked'}
                tone={diagnostics.rolloutGate.controlledBetaReady ? 'success' : 'danger'}
              />
              <StatusBadge
                label={
                  diagnostics.rolloutGate.productionReady
                    ? 'production ready'
                    : 'production blocked'
                }
                tone={diagnostics.rolloutGate.productionReady ? 'success' : 'danger'}
              />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-foreground">Rollout Notes</h2>
            <ul className="mt-4 space-y-2 text-xs leading-5 text-muted">
              {diagnostics.rolloutGate.notes.map((note) => (
                <li className="rounded-lg border border-white/10 bg-black/[0.18] p-2.5" key={note}>
                  {note}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Hosting Target Readiness
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {diagnostics.hostingTargetReadiness.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={diagnostics.hostingTargetReadiness.status}
                tone={
                  diagnostics.hostingTargetReadiness.status === 'ready'
                    ? 'success'
                    : diagnostics.hostingTargetReadiness.status === 'blocked'
                      ? 'danger'
                      : 'warning'
                }
              />
              <StatusBadge label={diagnostics.hostingTargetReadiness.label} tone="neutral" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-5">
            {diagnostics.hostingTargetReadiness.blockerGroups.map((group) => (
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
          <p className="mt-4 rounded-lg border border-brand/20 bg-brand/[0.08] p-3 text-sm font-semibold text-brand">
            {diagnostics.hostingTargetReadiness.recommendedNextStep}
          </p>
          <LinkButton className="mt-4" href="/internal/deployment" variant="secondary">
            Open deployment plan
          </LinkButton>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Security Readiness
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Internal session and mutation-safety posture for beta release.
              </p>
            </div>
            <StatusBadge
              label={diagnostics.securityReadiness.status}
              tone={
                diagnostics.securityReadiness.status === 'ready'
                  ? 'success'
                  : diagnostics.securityReadiness.status === 'blocked'
                    ? 'danger'
                    : 'warning'
              }
            />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Session hours" value={diagnostics.securityReadiness.sessionHours} />
            <SecurityFlag
              label="CSRF protection"
              value={diagnostics.securityReadiness.csrfProtectionEnabled}
            />
            <SecurityFlag
              label="CSRF secret"
              value={diagnostics.securityReadiness.csrfSecretConfigured}
            />
            <SecurityFlag
              label="Secure cookies"
              value={diagnostics.securityReadiness.secureCookies}
            />
          </div>
          {diagnostics.securityReadiness.issues.length > 0 ? (
            <div className="mt-4 space-y-2">
              {diagnostics.securityReadiness.issues.map((issue) => (
                <p
                  className="rounded-lg border border-sun/20 bg-sun/[0.08] p-2.5 text-xs leading-5 text-sun"
                  key={issue.id}
                >
                  {issue.message}
                </p>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Integration Activation
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Deployment-aware provider checks for media, analytics, alerts, and monetization. Use
                the protected integration API to run active delivery checks before rollout.
              </p>
            </div>
            <StatusBadge
              label={`${diagnostics.providerRequirements.filter((item) => item.status === 'blocked').length} blockers`}
              tone={
                diagnostics.providerRequirements.some((item) => item.status === 'blocked')
                  ? 'danger'
                  : diagnostics.providerRequirements.some((item) => item.status === 'warning')
                    ? 'warning'
                    : 'success'
              }
            />
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-4">
            {diagnostics.providerRequirements.map((requirement) => (
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
                  <StatusBadge label={requirement.requiredFor} tone="neutral" />
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                  {requirement.label}
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted">{requirement.summary}</p>
                <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-2 text-xs font-semibold text-muted">
                  {requirement.mode} - {requirement.activationState}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">{requirement.action}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            Protected endpoints: /api/internal/integrations/status and
            /api/internal/integrations/test.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ProviderCard
            details={[
              `State: ${diagnostics.providers.media.activationState}`,
              `External config: ${diagnostics.providers.media.externalConfigured ? 'complete' : 'not active'}`,
              `Uploads: ${diagnostics.providers.media.supportsUploads ? 'supported' : 'not active'}`,
              `App serving: ${diagnostics.providers.media.supportsAppServing ? 'supported' : 'provider URL required'}`,
              diagnostics.providers.media.storageRoot
                ? `Root: ${diagnostics.providers.media.storageRoot}`
                : diagnostics.providers.media.publicBaseUrl
                  ? `Public base: ${diagnostics.providers.media.publicBaseUrl}`
                  : 'Public base: not configured',
              `Assets: ${
                Object.entries(diagnostics.providers.media.assetsByProvider)
                  .map(([provider, count]) => `${provider} ${count}`)
                  .join(', ') || 'none'
              }`
            ]}
            label={diagnostics.providers.media.label}
            mode={diagnostics.providers.media.mode}
            status={diagnostics.providers.media.status}
            title="Media Storage"
            warnings={diagnostics.providers.media.warnings}
          />
          <ProviderCard
            details={[
              `State: ${diagnostics.providers.analytics.activationState}`,
              `Database log: ${diagnostics.providers.analytics.databaseLogEnabled ? 'on' : 'off'}`,
              `External dispatch: ${diagnostics.providers.analytics.externalConfigured ? 'configured' : 'not configured'}`,
              `Timeout: ${diagnostics.providers.analytics.timeoutMs} ms`,
              `${diagnostics.counts.analyticsEvents24h} events in the last 24h`,
              `${diagnostics.counts.analyticsDeliveryFailures24h} delivery failures in the last 24h`
            ]}
            label={diagnostics.providers.analytics.label}
            mode={diagnostics.providers.analytics.mode}
            status={diagnostics.providers.analytics.status}
            title="Analytics"
            warnings={diagnostics.providers.analytics.warnings}
          />
          <ProviderCard
            details={[
              `State: ${diagnostics.providers.alerts.activationState}`,
              `Webhook: ${diagnostics.providers.alerts.webhookConfigured ? 'configured' : 'not configured'}`,
              `Email: ${diagnostics.providers.alerts.emailConfigured ? 'configured' : 'not configured'}`,
              `Timeout: ${diagnostics.providers.alerts.timeoutMs} ms`
            ]}
            label={diagnostics.providers.alerts.label}
            mode={diagnostics.providers.alerts.mode}
            status={diagnostics.providers.alerts.status}
            title="Monitoring Alerts"
            warnings={diagnostics.providers.alerts.warnings}
          />
          <ProviderCard
            details={[
              `State: ${diagnostics.providers.ads.activationState}`,
              `Enabled placements: ${diagnostics.providers.ads.enabledPlacements}`,
              `Sponsored-only placements: ${diagnostics.providers.ads.sponsoredOnlyPlacements}`,
              `External ad server: ${diagnostics.providers.ads.externalConfigured ? 'configured' : 'not configured'}`,
              `${diagnostics.counts.adPlacements} total placement records`
            ]}
            label={diagnostics.providers.ads.label}
            mode={diagnostics.providers.ads.mode}
            status={diagnostics.providers.ads.status}
            title="Monetization"
            warnings={diagnostics.providers.ads.warnings}
          />
          <ProviderCard
            details={[
              `Directory: ${diagnostics.backup.backupDirectory}`,
              `pg_dump: ${diagnostics.backup.pgDumpCommand}`,
              `pg_restore: ${diagnostics.backup.pgRestoreCommand}`,
              `psql: ${diagnostics.backup.psqlCommand}`,
              `Retention target: ${diagnostics.backup.retentionDays} days`,
              `Local media files: ${diagnostics.backup.includesLocalMediaFiles ? 'include in backup bundle' : 'provider-managed'}`
            ]}
            label="PostgreSQL backup and restore helper readiness"
            mode={
              diagnostics.backup.databaseConfigured ? 'database configured' : 'database missing'
            }
            status={diagnostics.backup.status}
            title="Backups & Restore"
            warnings={diagnostics.backup.issues.map((issue) => issue.message)}
          />
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-5 sm:p-6">
          <h2 className="font-display text-2xl font-bold text-foreground">Warnings</h2>
          {diagnostics.warnings.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
              {diagnostics.warnings.map((warning) => (
                <li className="rounded-lg border border-sun/20 bg-sun/[0.08] p-3" key={warning}>
                  {warning}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-lg border border-brand/20 bg-brand/[0.08] p-3 text-sm font-semibold text-brand">
              No active diagnostics warnings.
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-muted">
            Generated at {new Date(diagnostics.generatedAt).toLocaleString()}.
          </p>
        </section>
      </PageContainer>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/[0.22] p-4">
      <p className="font-display text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm font-semibold capitalize text-muted">{label}</p>
    </div>
  );
}

function SecurityFlag({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/[0.22] p-4">
      <StatusBadge label={value ? 'enabled' : 'inactive'} tone={value ? 'success' : 'warning'} />
      <p className="mt-2 text-sm font-semibold text-muted">{label}</p>
    </div>
  );
}

function providerTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'brand' {
  if (status === 'operational' || status === 'configured' || status === 'ready') return 'success';
  if (status === 'misconfigured' || status === 'incomplete' || status === 'blocked')
    return 'danger';
  if (status === 'disabled' || status === 'inactive') return 'neutral';
  return 'warning';
}

function ProviderCard({
  title,
  label,
  mode,
  status,
  details,
  warnings
}: {
  title: string;
  label: string;
  mode: string;
  status: string;
  details: string[];
  warnings: string[];
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={status} tone={providerTone(status)} />
        <StatusBadge label={mode} tone="neutral" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-sm font-semibold text-muted">{label}</p>
      <ul className="mt-4 space-y-2 text-xs leading-5 text-muted">
        {details.map((detail) => (
          <li
            className="break-words rounded-lg border border-white/10 bg-black/[0.18] p-2.5"
            key={detail}
          >
            {detail}
          </li>
        ))}
      </ul>
      {warnings.length > 0 ? (
        <div className="mt-4 space-y-2">
          {warnings.map((warning) => (
            <p
              className="rounded-lg border border-sun/20 bg-sun/[0.08] p-2.5 text-xs leading-5 text-sun"
              key={warning}
            >
              {warning}
            </p>
          ))}
        </div>
      ) : null}
    </article>
  );
}
