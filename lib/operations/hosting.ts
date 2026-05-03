import { appConfig } from '@/lib/config';
import type {
  HostingEnvGroup,
  HostingTarget,
  HostingTargetReadiness,
  LaunchBlockerGroup,
  OperationalIssue,
  OperationalStatus,
  ProviderRequirement,
  RolloutGate,
  RolloutStageReadiness
} from '@/types/operations';

type HostingReadinessInput = {
  publicPlayableGames: number;
  failedQaGames: number;
  approvedUnpublished: number;
  activeInternalUsers: number;
  providerRequirements: ProviderRequirement[];
  rolloutGate: RolloutGate;
  backupStatus: string;
};

const hostingLabels: Record<HostingTarget, string> = {
  'local-dev': 'Local development',
  vps: 'VPS / self-hosted Node',
  'managed-node': 'Managed Node host',
  container: 'Containerized deployment',
  platform: 'Platform deployment'
};

const deploymentClasses: Record<HostingTarget, HostingTargetReadiness['deploymentClass']> = {
  'local-dev': 'local',
  vps: 'self-hosted',
  'managed-node': 'managed',
  container: 'containerized',
  platform: 'platform'
};

const targetAssumptions: Record<HostingTarget, string[]> = {
  'local-dev': [
    'Runs from the canonical Windows workspace path during development.',
    'Local media storage and local PostgreSQL are acceptable for development only.',
    'Internal auth may use dev seed credentials until a hosted rollout is selected.'
  ],
  vps: [
    'A reverse proxy terminates TLS and forwards traffic to the Next.js Node process.',
    'PostgreSQL, media storage, backups, and process supervision are operator-managed.',
    'Health endpoints should be wired to external uptime checks before beta.'
  ],
  'managed-node': [
    'The hosting provider runs the Next.js Node server and injects environment variables.',
    'Persistent local disk should not be assumed unless the provider explicitly supports it.',
    'Database, media, analytics, and alert providers should be externally managed.'
  ],
  container: [
    'The app runs as an immutable image with runtime environment variables.',
    'Media must use object storage unless a durable volume and backup plan are deliberate.',
    'Database migrations, seed steps, and health checks should be part of release orchestration.'
  ],
  platform: [
    'The platform handles builds, deployments, routing, and environment injection.',
    'Runtime filesystem persistence should be treated as unavailable.',
    'Provider integrations and managed PostgreSQL should be configured outside the app image.'
  ]
};

function issue(
  id: string,
  area: OperationalIssue['area'],
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

function statusFromIssues(issues: OperationalIssue[]): OperationalStatus {
  if (issues.some((item) => item.severity === 'critical')) return 'blocked';
  if (issues.length > 0) return 'watch';

  return 'ready';
}

function envGroup(
  input: Omit<HostingEnvGroup, 'status'> & { issues?: OperationalIssue[] }
): HostingEnvGroup {
  return {
    ...input,
    status: statusFromIssues(input.issues ?? [])
  };
}

function requiredEnvGroups() {
  const productionLike = appConfig.productionLike || appConfig.hostingTarget !== 'local-dev';
  const hosted = appConfig.hostingTarget !== 'local-dev';

  return [
    envGroup({
      id: 'core',
      label: 'Core runtime',
      requiredFor: 'private_beta',
      variables: [
        'DATABASE_URL',
        'NEXT_PUBLIC_SITE_URL',
        'PIXLO_ENVIRONMENT_MODE',
        'PIXLO_HOSTING_TARGET',
        'PIXLO_ROLLOUT_STAGE'
      ],
      summary: 'Base app URL, PostgreSQL, environment mode, hosting target, and rollout stage.',
      issues: [
        ...(!appConfig.databaseConfigured
          ? [
              issue(
                'hosting-core-database',
                'deployment',
                'critical',
                'DATABASE_URL is missing.',
                'Configure the target PostgreSQL connection before hosted rollout.'
              )
            ]
          : []),
        ...(hosted && appConfig.siteUrl.includes('localhost')
          ? [
              issue(
                'hosting-core-site-url',
                'deployment',
                'critical',
                'NEXT_PUBLIC_SITE_URL is still localhost for a hosted target.',
                'Set NEXT_PUBLIC_SITE_URL to the staging or production domain.'
              )
            ]
          : [])
      ]
    }),
    envGroup({
      id: 'internal-auth',
      label: 'Internal auth',
      requiredFor: 'private_beta',
      variables: ['PIXLO_INTERNAL_ADMIN_EMAIL', 'PIXLO_INTERNAL_ADMIN_PASSWORD'],
      summary: 'Explicit internal admin seed credentials and protected operations access.',
      issues:
        productionLike &&
        (!appConfig.internalAuth.adminEmailConfigured ||
          !appConfig.internalAuth.adminPasswordConfigured)
          ? [
              issue(
                'hosting-auth-explicit-admin',
                'operations',
                'critical',
                'Explicit internal admin seed credentials are not fully configured.',
                'Set PIXLO_INTERNAL_ADMIN_EMAIL and PIXLO_INTERNAL_ADMIN_PASSWORD before hosted rollout.'
              )
            ]
          : []
    }),
    envGroup({
      id: 'media',
      label: 'Media storage',
      requiredFor: appConfig.rollout.requireCloudMediaForProduction ? 'production' : 'optional',
      variables: [
        'PIXLO_MEDIA_STORAGE_PROVIDER',
        'PIXLO_MEDIA_BUCKET',
        'PIXLO_MEDIA_PUBLIC_BASE_URL',
        'PIXLO_MEDIA_ACCESS_KEY_ID',
        'PIXLO_MEDIA_SECRET_ACCESS_KEY'
      ],
      summary: 'Object storage configuration for durable thumbnail and cover uploads.',
      issues:
        productionLike &&
        appConfig.rollout.requireCloudMediaForProduction &&
        appConfig.media.storageProvider === 'local-dev'
          ? [
              issue(
                'hosting-media-local',
                'media',
                'critical',
                'Local media storage is active for a production-like target.',
                'Enable S3/R2 media storage or explicitly accept local filesystem backup risk.'
              )
            ]
          : []
    }),
    envGroup({
      id: 'monitoring',
      label: 'Monitoring and alerts',
      requiredFor: appConfig.rollout.requireAlertsForProduction ? 'production' : 'optional',
      variables: ['PIXLO_MONITORING_WEBHOOK_URL', 'PIXLO_MONITORING_WEBHOOK_SECRET'],
      summary:
        'Webhook alert destination and optional shared secret for operational notifications.',
      issues:
        productionLike &&
        appConfig.rollout.requireAlertsForProduction &&
        !appConfig.monitoring.alertWebhookUrl
          ? [
              issue(
                'hosting-alerts-missing',
                'monitoring',
                'critical',
                'No active alert webhook is configured for a production-like target.',
                'Set PIXLO_MONITORING_WEBHOOK_URL and run the protected alert test endpoint.'
              )
            ]
          : []
    }),
    envGroup({
      id: 'analytics-monetization',
      label: 'Analytics and monetization',
      requiredFor: 'optional',
      variables: [
        'PIXLO_ANALYTICS_PROVIDER',
        'PIXLO_ANALYTICS_ENDPOINT',
        'PIXLO_ANALYTICS_WRITE_KEY',
        'PIXLO_AD_PROVIDER',
        'PIXLO_AD_SERVER_ENDPOINT'
      ],
      summary:
        'External analytics and ad-serving activation paths for provider-backed launch reporting.',
      issues: []
    }),
    envGroup({
      id: 'backup',
      label: 'Backups and restore',
      requiredFor: 'public_beta',
      variables: ['PIXLO_BACKUP_DIRECTORY', 'PIXLO_PG_DUMP_PATH', 'PIXLO_PG_RESTORE_PATH'],
      summary:
        'Database backup path, PostgreSQL tooling, restore dry-run support, and retention target.',
      issues:
        productionLike && appConfig.backup.directory === 'backups'
          ? [
              issue(
                'hosting-backup-local-directory',
                'backups',
                'warning',
                'Backup directory is using the local default for a production-like target.',
                'Set PIXLO_BACKUP_DIRECTORY to a durable backup location and run a dry-run.'
              )
            ]
          : []
    })
  ];
}

function rolloutStageReadiness(input: HostingReadinessInput): RolloutStageReadiness[] {
  const providerWarnings = input.providerRequirements
    .filter((requirement) => requirement.status !== 'satisfied')
    .map((requirement, index) =>
      issue(
        `rollout-provider-${requirement.area}-${index}`,
        requirement.area === 'monetization' ? 'monetization' : requirement.area,
        requirement.status === 'blocked' ? 'critical' : 'warning',
        requirement.summary,
        requirement.action
      )
    );
  const privateBetaBlockers = [
    ...(!appConfig.databaseConfigured
      ? [
          issue(
            'private-beta-database',
            'deployment',
            'critical',
            'PostgreSQL is not configured.',
            'Configure DATABASE_URL and verify /api/health before inviting private beta users.'
          )
        ]
      : []),
    ...(input.activeInternalUsers === 0
      ? [
          issue(
            'private-beta-operators',
            'operations',
            'critical',
            'No active internal operators exist.',
            'Seed or create at least one internal admin before beta.'
          )
        ]
      : [])
  ];
  const publicBetaWarnings = [
    ...(input.publicPlayableGames < appConfig.rollout.minBetaPublicGames
      ? [
          issue(
            'public-beta-content',
            'content',
            'warning',
            `Only ${input.publicPlayableGames} public playable games are available for beta.`,
            `Publish at least ${appConfig.rollout.minBetaPublicGames} playable QA-passed games for a useful public beta.`
          )
        ]
      : []),
    ...(input.approvedUnpublished > 0
      ? [
          issue(
            'public-beta-approved-queue',
            'content',
            'warning',
            `${input.approvedUnpublished} approved submissions are not published yet.`,
            'Review approved submissions before expanding beta traffic.'
          )
        ]
      : []),
    ...providerWarnings.filter((warning) => warning.severity !== 'critical')
  ];

  return [
    {
      stage: 'private_beta',
      label: 'Private Beta',
      status: statusFromIssues(privateBetaBlockers),
      summary:
        'Operator-led smoke testing with restricted access and live database-backed workflows.',
      checks: [
        'Verify /api/health and /api/monitoring/status from the hosted environment',
        'Sign in to internal tools and review submissions, games, readiness, and diagnostics',
        'Submit one test game intake and confirm durable persistence'
      ],
      blockers: privateBetaBlockers,
      warnings: []
    },
    {
      stage: 'public_beta',
      label: 'Public Beta',
      status: statusFromIssues([...privateBetaBlockers, ...publicBetaWarnings]),
      summary:
        'Limited public traffic with enough content, stable media, and monitoring visibility.',
      checks: [
        'Confirm public browse, search, game pages, and submission page load from the beta domain',
        'Run provider integration status and alert tests where configured',
        'Confirm backup dry-run and restore notes are current'
      ],
      blockers: privateBetaBlockers,
      warnings: publicBetaWarnings
    },
    {
      stage: 'production',
      label: 'Production Launch',
      status: input.rolloutGate.productionReady ? 'ready' : 'blocked',
      summary:
        'Full public launch behind explicit production mode, public launch switch, and production blockers cleared.',
      checks: [
        'Set PIXLO_ENVIRONMENT_MODE=production and PIXLO_ROLLOUT_STAGE=production deliberately',
        'Set PIXLO_PUBLIC_LAUNCH_ENABLED=1 only after readiness is green',
        'Run post-deploy route, provider, backup, and alert smoke checks'
      ],
      blockers: input.rolloutGate.blockers,
      warnings: input.rolloutGate.warnings
    }
  ];
}

function groupIssues(
  input: HostingReadinessInput,
  envGroups: HostingEnvGroup[]
): LaunchBlockerGroup[] {
  const productionLaunchSelected =
    appConfig.environmentMode === 'production' ||
    appConfig.rolloutStage === 'production' ||
    appConfig.publicLaunchEnabled;
  const providerIssues = input.providerRequirements
    .filter((requirement) => requirement.status !== 'satisfied')
    .map((requirement, index) =>
      issue(
        `provider-${requirement.area}-${index}`,
        requirement.area === 'alerts' ? 'monitoring' : requirement.area,
        requirement.status === 'blocked' ? 'critical' : 'warning',
        requirement.summary,
        requirement.action
      )
    );
  const envIssues = envGroups.flatMap((group) =>
    group.status === 'ready'
      ? []
      : [
          issue(
            `env-${group.id}`,
            'deployment',
            group.status === 'blocked' ? 'critical' : 'warning',
            `${group.label} needs attention.`,
            group.summary
          )
        ]
  );
  const contentIssues = [
    ...(input.publicPlayableGames < appConfig.rollout.minBetaPublicGames
      ? [
          issue(
            'content-beta-count',
            'content',
            'warning',
            `Only ${input.publicPlayableGames} public playable games are ready for beta.`,
            `Publish at least ${appConfig.rollout.minBetaPublicGames} playable QA-passed games for public beta.`
          )
        ]
      : []),
    ...(input.failedQaGames > 0
      ? [
          issue(
            'content-failed-qa',
            'content',
            'warning',
            `${input.failedQaGames} games have failed QA.`,
            'Resolve failed QA before launch expansion.'
          )
        ]
      : [])
  ];
  const monitoringProductionIssues = input.rolloutGate.blockers.filter((item) =>
    item.id.includes('alert')
  );
  const operationsProductionIssues = input.rolloutGate.blockers.filter(
    (item) => item.id.includes('admin') || item.id.includes('backup')
  );

  return [
    {
      id: 'infrastructure',
      title: 'Infrastructure',
      blockers: envIssues.filter((item) => item.severity === 'critical'),
      warnings: envIssues.filter((item) => item.severity !== 'critical')
    },
    {
      id: 'providers',
      title: 'Providers',
      blockers: providerIssues.filter((item) => item.severity === 'critical'),
      warnings: providerIssues.filter((item) => item.severity !== 'critical')
    },
    {
      id: 'content',
      title: 'Content',
      blockers: [],
      warnings: contentIssues
    },
    {
      id: 'monitoring',
      title: 'Monitoring',
      blockers: productionLaunchSelected ? monitoringProductionIssues : [],
      warnings: [
        ...(!productionLaunchSelected ? monitoringProductionIssues : []),
        ...input.rolloutGate.warnings.filter((item) => item.id.includes('analytics'))
      ]
    },
    {
      id: 'operations',
      title: 'Operations',
      blockers: productionLaunchSelected ? operationsProductionIssues : [],
      warnings: [
        ...(!productionLaunchSelected ? operationsProductionIssues : []),
        ...input.rolloutGate.warnings.filter((item) => item.id.includes('qa'))
      ]
    }
  ];
}

function smokeChecks(target: HostingTarget) {
  const common = [
    'GET / returns 200 from the target domain',
    'GET /api/health returns database reachable and coherent provider modes',
    'GET /api/monitoring/status returns deployment target, rollout stage, and provider requirements',
    'Internal sign-in works and protected internal pages redirect when unauthenticated',
    'Protected internal mutation endpoints reject requests without a signed CSRF token',
    'Developer submission form persists a test submission in PostgreSQL'
  ];

  if (target === 'container') {
    return [
      ...common,
      'Container starts with runtime env vars only; no build-time secret assumptions',
      'Migrations, seed policy, and restart behavior are documented for the release job'
    ];
  }

  if (target === 'vps') {
    return [
      ...common,
      'Reverse proxy TLS, process manager restart, firewall, and backup cron are configured',
      'Local media storage is backed up or replaced by object storage before public launch'
    ];
  }

  if (target === 'managed-node' || target === 'platform') {
    return [
      ...common,
      'Managed environment variables are set for preview/staging/production separately',
      'Runtime local disk is not used for production media unless the provider guarantees persistence'
    ];
  }

  return [
    ...common,
    'Use the canonical Windows path and avoid mixed-case workspace paths while developing'
  ];
}

function handoffGuidance(target: HostingTarget) {
  return [
    `Target: ${hostingLabels[target]}. Keep the deployment assumptions visible to the operator doing the handoff.`,
    'Before first production deployment, run migrations, seed/verify internal admin access, then run route smoke checks.',
    'For staging, verify public pages, developer submission, internal auth, provider status, readiness, and alert test where configured.',
    'For beta, keep PIXLO_ROLLOUT_STAGE at private_beta or public_beta until production blockers are intentionally cleared.',
    'Rollback by restoring the previous app build and database backup; verify media storage compatibility before reverting published content.'
  ];
}

function recommendedNextStep(input: HostingReadinessInput, groups: LaunchBlockerGroup[]) {
  const firstBlocker = groups.flatMap((group) => group.blockers)[0];

  if (firstBlocker) {
    return firstBlocker.action;
  }

  if (input.publicPlayableGames < appConfig.rollout.minBetaPublicGames) {
    return `Publish at least ${appConfig.rollout.minBetaPublicGames} playable QA-passed games before public beta.`;
  }

  if (appConfig.hostingTarget === 'local-dev') {
    return 'Select PIXLO_HOSTING_TARGET for the intended hosted environment when planning the first beta deployment.';
  }

  return 'Run the staging smoke checklist, then move rollout stage deliberately from private beta to public beta.';
}

export function getHostingTargetReadiness(input: HostingReadinessInput): HostingTargetReadiness {
  const envGroups = requiredEnvGroups();
  const rolloutStages = rolloutStageReadiness(input);
  const blockerGroups = groupIssues(input, envGroups);
  const blockers = blockerGroups.flatMap((group) => group.blockers);
  const warnings = blockerGroups.flatMap((group) => group.warnings);
  const target = appConfig.hostingTarget;
  const status = blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'watch' : 'ready';

  return {
    target,
    label: hostingLabels[target],
    status,
    deploymentClass: deploymentClasses[target],
    summary:
      target === 'local-dev'
        ? 'Local development remains safe; choose a hosting target before beta handoff.'
        : `${hostingLabels[target]} planning is ${status}; ${blockers.length} blockers and ${warnings.length} warnings are visible.`,
    assumptions: targetAssumptions[target],
    envGroups,
    rolloutStages,
    blockerGroups,
    smokeChecks: smokeChecks(target),
    handoffGuidance: handoffGuidance(target),
    recommendedNextStep: recommendedNextStep(input, blockerGroups)
  };
}
