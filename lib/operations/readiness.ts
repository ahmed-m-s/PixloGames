import { getAdProviderDiagnostics } from '@/lib/ads/provider';
import { getAnalyticsProviderDiagnostics } from '@/lib/analytics-provider';
import { appConfig, getConfigWarnings } from '@/lib/config';
import { prisma } from '@/lib/db/prisma';
import { getMediaProviderDiagnostics } from '@/lib/media/storage-provider';
import { getAlertProviderDiagnostics } from '@/lib/monitoring/alerts';
import { getBackupReadiness } from '@/lib/operations/backup';
import {
  getDeploymentProfile,
  getDeploymentProviderRequirements,
  getRolloutGate
} from '@/lib/operations/deployment';
import { getDeploymentExecutionPlan } from '@/lib/operations/deployment-artifacts';
import { getHostingTargetReadiness } from '@/lib/operations/hosting';
import { getBetaReleaseChecklist, getSecurityReadiness } from '@/lib/operations/security';
import type {
  LaunchReadinessArea,
  LaunchReadinessItem,
  OperationalIssue,
  OperationalStatus
} from '@/types/operations';

function statusFromIssues(issues: OperationalIssue[]): OperationalStatus {
  if (issues.some((issue) => issue.severity === 'critical')) {
    return 'blocked';
  }

  if (issues.length > 0) {
    return 'watch';
  }

  return 'ready';
}

function issue(
  id: string,
  area: LaunchReadinessArea,
  severity: OperationalIssue['severity'],
  message: string,
  action: string
): OperationalIssue {
  return {
    id,
    area,
    severity,
    message,
    action
  };
}

function readinessItem(input: Omit<LaunchReadinessItem, 'status'>): LaunchReadinessItem {
  return {
    ...input,
    status: statusFromIssues(input.issues)
  };
}

export async function getLaunchReadiness() {
  const [
    totalGames,
    publicGames,
    failedQaGames,
    approvedUnpublished,
    activeInternalUsers,
    adPlacements,
    recentAnalyticsEvents
  ] = await Promise.all([
    prisma.game.count(),
    prisma.game.count({
      where: {
        visibility: 'public'
      }
    }),
    prisma.game.count({
      where: {
        qaStatus: 'failed'
      }
    }),
    prisma.submission.count({
      where: {
        status: 'approved',
        NOT: {
          publishingStatus: 'published'
        }
      }
    }),
    prisma.internalUser.count({
      where: {
        active: true
      }
    }),
    prisma.adPlacement.findMany(),
    prisma.analyticsEvent.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
        }
      }
    })
  ]);

  const media = getMediaProviderDiagnostics();
  const analytics = getAnalyticsProviderDiagnostics();
  const alerts = getAlertProviderDiagnostics();
  const ads = getAdProviderDiagnostics(adPlacements);
  const backup = getBackupReadiness();
  const deployment = getDeploymentProfile();
  const rolloutGate = getRolloutGate({
    publicGames,
    failedQaGames,
    activeInternalUsers,
    mediaStatus: media.status,
    mediaActivationState: media.activationState,
    analyticsStatus: analytics.status,
    alertStatus: alerts.status,
    alertActivationState: alerts.activationState,
    backupStatus: backup.status
  });
  const providerRequirements = getDeploymentProviderRequirements({
    mediaStatus: media.status,
    mediaActivationState: media.activationState,
    analyticsStatus: analytics.status,
    analyticsActivationState: analytics.activationState,
    alertStatus: alerts.status,
    alertActivationState: alerts.activationState,
    adStatus: ads.status,
    adActivationState: ads.activationState
  });
  const hostingTargetReadiness = getHostingTargetReadiness({
    publicGames,
    failedQaGames,
    approvedUnpublished,
    activeInternalUsers,
    providerRequirements,
    rolloutGate,
    backupStatus: backup.status
  });
  const deploymentExecutionPlan = getDeploymentExecutionPlan(hostingTargetReadiness);
  const securityReadiness = getSecurityReadiness();
  const betaReleaseChecklist = getBetaReleaseChecklist({
    security: securityReadiness,
    hosting: hostingTargetReadiness
  });
  const configWarnings = getConfigWarnings();
  const expectedPublicGames = Number.isFinite(appConfig.monitoring.expectedPublicGameCount)
    ? appConfig.monitoring.expectedPublicGameCount
    : 1;

  const items: LaunchReadinessItem[] = [
    readinessItem({
      area: 'deployment',
      label: 'Deployment Mode',
      summary: `${deployment.environmentMode} environment, ${deployment.rolloutStage} rollout, ${rolloutGate.label}.`,
      checks: [
        'Environment mode separates local, preview, staging, and production behavior',
        'Rollout stage controls beta vs production launch expectations',
        'Production launch requires explicit public launch enablement'
      ],
      issues:
        deployment.rolloutStage === 'production' || deployment.publicLaunchEnabled
          ? rolloutGate.blockers
          : rolloutGate.warnings
    }),
    readinessItem({
      area: 'database',
      label: 'Database',
      summary: appConfig.databaseConfigured
        ? `${totalGames} games are available from PostgreSQL.`
        : 'Database connection is not configured.',
      checks: [
        'DATABASE_URL configured',
        'Prisma repository queries return game and submission counts',
        'Health endpoint reports database reachability'
      ],
      issues: appConfig.databaseConfigured
        ? []
        : [
            issue(
              'database-url-missing',
              'database',
              'critical',
              'DATABASE_URL is not configured.',
              'Set DATABASE_URL for the target PostgreSQL database before deployment.'
            )
          ]
    }),
    readinessItem({
      area: 'auth',
      label: 'Internal Auth',
      summary: `${activeInternalUsers} active internal users are available for operations.`,
      checks: [
        'Internal routes require session auth',
        'Mutation APIs require permissions',
        'Production-like deployments should use explicit admin seed credentials'
      ],
      issues: [
        ...(activeInternalUsers > 0
          ? []
          : [
              issue(
                'auth-no-internal-users',
                'auth',
                'critical',
                'No active internal users exist.',
                'Seed or create an admin user before launch.'
              )
            ]),
        ...(appConfig.productionLike && !appConfig.internalAuth.adminPasswordConfigured
          ? [
              issue(
                'auth-default-password-risk',
                'auth',
                'warning',
                'Production-like deployment does not have PIXLO_INTERNAL_ADMIN_PASSWORD configured.',
                'Set explicit admin seed credentials and rotate any default local credentials.'
              )
            ]
          : [])
      ]
    }),
    readinessItem({
      area: 'security',
      label: 'Security Hardening',
      summary: `Internal sessions expire after ${securityReadiness.sessionHours} hours; mutation CSRF protection is ${securityReadiness.csrfProtectionEnabled ? 'enabled' : 'disabled'}.`,
      checks: securityReadiness.checks,
      issues: securityReadiness.issues
    }),
    readinessItem({
      area: 'publishing',
      label: 'Publishing Workflow',
      summary: `${publicGames} public games, ${approvedUnpublished} approved submissions awaiting publication.`,
      checks: [
        'Approved submissions can become game drafts',
        'Publishing validation blocks incomplete records',
        'Operators can see approved-but-unpublished queue'
      ],
      issues: [
        ...(publicGames >= expectedPublicGames
          ? []
          : [
              issue(
                'publishing-low-public-count',
                'publishing',
                appConfig.productionLike ? 'critical' : 'warning',
                `Only ${publicGames} public games are available.`,
                'Publish enough QA-passed games before launch or lower PIXLO_EXPECTED_PUBLIC_GAME_COUNT for this environment.'
              )
            ]),
        ...(failedQaGames > 0
          ? [
              issue(
                'publishing-failed-qa',
                'publishing',
                'warning',
                `${failedQaGames} games have failed QA.`,
                'Resolve failed QA games before promoting content.'
              )
            ]
          : [])
      ]
    }),
    readinessItem({
      area: 'media',
      label: 'Media Storage',
      summary: `${media.label} is ${media.status}; ${media.activationState}.`,
      checks: [
        'Thumbnail and cover uploads are routed through the provider abstraction',
        'Media metadata persists in PostgreSQL',
        'S3/R2-compatible uploads activate only when the full object-storage config group is present',
        'Production-like deployments should avoid local-dev storage unless filesystem backups are explicit'
      ],
      issues: media.warnings.map((warning, index) =>
        issue(
          `media-${index}`,
          'media',
          media.status === 'misconfigured' ? 'critical' : 'warning',
          warning,
          'Review media provider environment variables and storage backup coverage.'
        )
      )
    }),
    readinessItem({
      area: 'analytics',
      label: 'Analytics',
      summary: `${analytics.label}; ${analytics.activationState}; ${recentAnalyticsEvents} events recorded in the last 24 hours.`,
      checks: [
        'Server events are non-blocking',
        'PostgreSQL analytics logging can remain active during provider rollout',
        'External provider mode performs bounded HTTP dispatch when endpoint and write key are configured'
      ],
      issues: analytics.warnings.map((warning, index) =>
        issue(
          `analytics-${index}`,
          'analytics',
          analytics.status === 'misconfigured' ? 'critical' : 'warning',
          warning,
          'Fix analytics provider config or keep local mode active.'
        )
      )
    }),
    readinessItem({
      area: 'monetization',
      label: 'Monetization',
      summary: `${ads.label}; ${ads.enabledPlacements} enabled placements.`,
      checks: [
        'Organic, featured, sponsored, and ad-served concepts remain distinct',
        'Public ad slots stay non-invasive',
        'External ad provider mode requires endpoint and publisher config'
      ],
      issues: ads.warnings.map((warning, index) =>
        issue(
          `ads-${index}`,
          'monetization',
          ads.status === 'misconfigured' ? 'critical' : 'warning',
          warning,
          'Enable intended placements or finish ad provider config before monetized launch.'
        )
      )
    }),
    readinessItem({
      area: 'seo',
      label: 'SEO',
      summary: appConfig.siteUrl.includes('localhost')
        ? 'SEO routes exist, but the site URL is still local.'
        : `Canonical site URL is ${appConfig.siteUrl}.`,
      checks: [
        'Sitemap and robots routes build successfully',
        'Public pages have route metadata',
        'Canonical URL should use the launch domain'
      ],
      issues:
        appConfig.productionLike && appConfig.siteUrl.includes('localhost')
          ? [
              issue(
                'seo-localhost-url',
                'seo',
                'critical',
                'NEXT_PUBLIC_SITE_URL points to localhost in a production-like environment.',
                'Set NEXT_PUBLIC_SITE_URL to the public launch domain.'
              )
            ]
          : []
    }),
    readinessItem({
      area: 'backups',
      label: 'Backups & Restore',
      summary: `Backup scripts target ${backup.backupDirectory}.`,
      checks: [
        'PowerShell backup and restore helpers are present',
        'Database backups use pg_dump custom format',
        'Local media files must be copied when local-dev storage is active'
      ],
      issues: backup.issues
    }),
    readinessItem({
      area: 'monitoring',
      label: 'Monitoring',
      summary:
        alerts.status === 'operational'
          ? 'Webhook alert delivery is active.'
          : alerts.status === 'scaffold'
            ? 'Alert destination is configured but delivery is still scaffold-level.'
            : 'No active external alert destination is configured yet.',
      checks: [
        'Health endpoint exposes service and provider mode state',
        'Internal diagnostics expose launch blockers and degraded states',
        'Webhook alert delivery activates only when PIXLO_MONITORING_WEBHOOK_URL is valid',
        'Production should wire health output to an external monitor'
      ],
      issues: [
        ...alerts.warnings.map((warning, index) =>
          issue(
            `alerts-${index}`,
            'monitoring',
            alerts.status === 'misconfigured' ? 'critical' : 'warning',
            warning,
            'Set a valid PIXLO_MONITORING_WEBHOOK_URL for active alert delivery, or keep local monitoring explicit.'
          )
        ),
        ...configWarnings.map((warning, index) =>
          issue(
            `config-${index}`,
            'monitoring',
            'warning',
            warning,
            'Review deployment configuration.'
          )
        )
      ]
    })
  ];

  const allIssues = items.flatMap((item) => item.issues);
  const blocked = items.filter((item) => item.status === 'blocked').length;
  const watch = items.filter((item) => item.status === 'watch').length;

  return {
    generatedAt: new Date().toISOString(),
    environment: appConfig.environment,
    deploymentTarget: appConfig.deploymentTarget,
    productionLike: appConfig.productionLike,
    summary: {
      status:
        blocked > 0 ? ('blocked' as const) : watch > 0 ? ('watch' as const) : ('ready' as const),
      ready: items.filter((item) => item.status === 'ready').length,
      watch,
      blocked,
      issues: allIssues.length
    },
    items,
    deployment,
    providerRequirements,
    hostingTargetReadiness,
    deploymentExecutionPlan,
    securityReadiness,
    betaReleaseChecklist,
    rolloutGate,
    backup
  };
}
