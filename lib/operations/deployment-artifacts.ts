import { appConfig } from '@/lib/config';
import type {
  DeploymentArtifact,
  DeploymentCommandGroup,
  DeploymentExecutionPlan,
  HostingTarget,
  HostingTargetReadiness
} from '@/types/operations';

const artifacts: DeploymentArtifact[] = [
  {
    id: 'env-production-template',
    label: 'Production environment template',
    kind: 'env-template',
    status: 'template',
    target: 'all',
    path: '.env.production.example',
    summary:
      'Grouped production variables for runtime, rollout gates, media, analytics, alerts, ads, and backups.',
    commands: [],
    notes: [
      'Use a host secret manager or private env file. Do not commit real values.',
      'Set PIXLO_CSRF_SECRET separately from admin passwords and database credentials.',
      'Keep PIXLO_PUBLIC_LAUNCH_ENABLED=0 until production blockers are cleared.'
    ]
  },
  {
    id: 'container-template',
    label: 'Container build template',
    kind: 'container-template',
    status: 'template',
    target: 'container',
    path: 'Dockerfile',
    summary: 'Multi-stage Node container template for building and running the Next.js app.',
    commands: [
      'docker build -t pixlogames-web .',
      'docker run --env-file .env.production -p 3000:3000 pixlogames-web'
    ],
    notes: [
      'Inject secrets at runtime.',
      'Use object storage for production media unless a durable volume and backup plan are intentional.'
    ]
  },
  {
    id: 'pm2-template',
    label: 'PM2 process template',
    kind: 'process-template',
    status: 'template',
    target: 'vps',
    path: 'deployment/templates/pm2.ecosystem.config.cjs',
    summary: 'Process-manager template for self-hosted Node/VPS deployments.',
    commands: ['pm2 start deployment/templates/pm2.ecosystem.config.cjs', 'pm2 save'],
    notes: [
      'PM2 is not a project dependency.',
      'Use a reverse proxy, TLS, firewall, and host-level log rotation on VPS deployments.'
    ]
  },
  {
    id: 'deployment-smoke-script',
    label: 'Deployment smoke checks',
    kind: 'smoke-script',
    status: 'ready',
    target: 'all',
    path: 'scripts/deployment-smoke.ps1',
    summary:
      'PowerShell smoke test for public routes, health, monitoring, protected redirects, and authenticated internal checks.',
    commands: ["$env:PIXLO_SMOKE_BASE_URL='https://games.example.com'; npm run ops:smoke"],
    notes: [
      'Set PIXLO_SMOKE_ADMIN_EMAIL and PIXLO_SMOKE_ADMIN_PASSWORD to include authenticated internal checks.',
      'Run against staging before production.'
    ]
  },
  {
    id: 'operator-deployment-notes',
    label: 'Operator deployment notes',
    kind: 'operator-doc',
    status: 'ready',
    target: 'all',
    path: 'deployment/README.md',
    summary:
      'Concise deployment sequence, reverse proxy notes, target assumptions, and rollback basics.',
    commands: [],
    notes: [
      'This is practical handoff documentation, not managed infrastructure automation.',
      'Keep it aligned with the active hosting target.'
    ]
  }
];

function commandGroups(target: HostingTarget): DeploymentCommandGroup[] {
  return [
    {
      label: 'Build and run',
      target: 'all',
      commands: ['npm ci', 'npm run db:deploy', 'npm run build', 'npm run start'],
      purpose: 'Standard production install, migration, build, and runtime sequence.'
    },
    {
      label: 'Local verification',
      target: 'all',
      commands: ['npm run lint', 'npm run typecheck', 'npm run build'],
      purpose: 'Pre-deploy quality gate before shipping an artifact.'
    },
    {
      label: 'Post-deploy smoke',
      target: 'all',
      commands: ["$env:PIXLO_SMOKE_BASE_URL='https://games.example.com'; npm run ops:smoke"],
      purpose: 'Route and health smoke test after deployment.'
    },
    ...(target === 'container'
      ? [
          {
            label: 'Container flow',
            target: 'container' as const,
            commands: [
              'docker build -t pixlogames-web .',
              'docker run --env-file .env.production -p 3000:3000 pixlogames-web'
            ],
            purpose: 'Container build/run path for container hosts.'
          }
        ]
      : []),
    ...(target === 'vps'
      ? [
          {
            label: 'VPS process manager',
            target: 'vps' as const,
            commands: ['pm2 start deployment/templates/pm2.ecosystem.config.cjs', 'pm2 save'],
            purpose: 'Example process manager flow for a self-hosted Node process.'
          }
        ]
      : [])
  ];
}

export function getDeploymentExecutionPlan(
  hostingReadiness: HostingTargetReadiness
): DeploymentExecutionPlan {
  const target = appConfig.hostingTarget;

  return {
    artifacts,
    commandGroups: commandGroups(target),
    reverseProxyNotes: [
      'Terminate TLS before traffic reaches the Next.js Node process.',
      'Forward requests to the configured PORT, default 3000.',
      `Set NEXT_PUBLIC_SITE_URL to the canonical HTTPS domain; current value is ${appConfig.siteUrl}.`,
      'Keep /api/health and /api/monitoring/status reachable to external uptime checks.',
      'For self-hosted deployments, preserve client IP and forwarded protocol headers at the reverse proxy.'
    ],
    startupShutdownNotes: [
      'Run prisma migrate deploy before starting a new production build.',
      'Use next start for the production server process.',
      'Keep runtime secrets in the host/platform secret manager, not in the repository.',
      'On shutdown or rollback, verify database backup and media readability before changing public rollout flags.'
    ],
    postDeploySmokeChecks: [
      ...hostingReadiness.smokeChecks,
      'Run npm run ops:smoke against the deployed base URL.',
      'Open /internal/deployment after sign-in and verify blocker groups before expanding rollout.'
    ]
  };
}
