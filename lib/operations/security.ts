import { appConfig } from '@/lib/config';
import type {
  BetaReleaseChecklistGroup,
  HostingTargetReadiness,
  OperationalIssue,
  OperationalStatus,
  SecurityReadiness
} from '@/types/operations';

function issue(
  id: string,
  area: string,
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

export function getSecurityReadiness(): SecurityReadiness {
  const issues: OperationalIssue[] = [
    ...(appConfig.productionLike && !appConfig.security.csrfSecretConfigured
      ? [
          issue(
            'security-csrf-secret',
            'security',
            'critical',
            'PIXLO_CSRF_SECRET is not configured for a production-like deployment.',
            'Set a long random PIXLO_CSRF_SECRET before hosted beta or production launch.'
          )
        ]
      : []),
    ...(appConfig.productionLike && !appConfig.siteUrl.startsWith('https://')
      ? [
          issue(
            'security-https-canonical-url',
            'security',
            'critical',
            'Canonical site URL is not HTTPS for a production-like deployment.',
            'Set NEXT_PUBLIC_SITE_URL to the HTTPS public domain.'
          )
        ]
      : []),
    ...(appConfig.productionLike && !appConfig.internalAuth.secureCookies
      ? [
          issue(
            'security-secure-cookie-flag',
            'security',
            'warning',
            'Internal session cookies are not using the Secure flag because NODE_ENV is not production.',
            'Run hosted beta and production with NODE_ENV=production behind HTTPS.'
          )
        ]
      : []),
    ...(!appConfig.security.internalMutationProtection
      ? [
          issue(
            'security-mutation-protection-disabled',
            'security',
            'critical',
            'Internal mutation CSRF protection is disabled.',
            'Keep internal mutation protection enabled for beta and production.'
          )
        ]
      : [])
  ];

  return {
    status: statusFromIssues(issues),
    sessionHours: appConfig.internalAuth.sessionHours,
    secureCookies: appConfig.internalAuth.secureCookies,
    sameSitePolicy: 'strict',
    csrfProtectionEnabled: appConfig.security.internalMutationProtection,
    csrfSecretConfigured: appConfig.security.csrfSecretConfigured,
    checks: [
      'Internal session cookies are HTTP-only and SameSite=Strict.',
      'Production runtime uses Secure internal session cookies when NODE_ENV=production.',
      'Protected internal POST/PATCH/PUT/DELETE API routes require a signed CSRF token.',
      'Internal sign-out requires a session-bound CSRF token.',
      'Session tokens are stored hashed in PostgreSQL and revoked on sign-out.'
    ],
    issues
  };
}

export function getBetaReleaseChecklist(input: {
  security: SecurityReadiness;
  hosting: HostingTargetReadiness;
}): BetaReleaseChecklistGroup[] {
  return [
    {
      title: 'Before Inviting Private Beta Users',
      status:
        input.hosting.rolloutStages.find((stage) => stage.stage === 'private_beta')?.status ??
        'watch',
      items: [
        'Run lint, typecheck, build, and deployment smoke checks.',
        'Confirm internal sign-in, readiness, diagnostics, deployment, and provider status pages.',
        'Submit one test developer intake and confirm it persists.',
        'Review security readiness and confirm internal mutation protection is enabled.'
      ],
      issues: input.security.issues.filter((item) => item.severity === 'critical')
    },
    {
      title: 'Before Public Beta Traffic',
      status:
        input.hosting.rolloutStages.find((stage) => stage.stage === 'public_beta')?.status ??
        'watch',
      items: [
        'Publish enough QA-passed games for the beta content threshold.',
        'Run provider integration status and alert tests where configured.',
        'Run backup dry-run and confirm rollback notes are current.',
        'Confirm public browse, search, game pages, and developer submission page from the beta domain.'
      ],
      issues:
        input.hosting.rolloutStages.find((stage) => stage.stage === 'public_beta')?.warnings ?? []
    },
    {
      title: 'Security Gate',
      status: input.security.status,
      items: input.security.checks,
      issues: input.security.issues
    },
    {
      title: 'Rollback Gate',
      status: input.hosting.status,
      items: [
        'Keep previous app artifact and latest database backup available.',
        'Know how to disable public launch by clearing PIXLO_PUBLIC_LAUNCH_ENABLED.',
        'Confirm media assets stay readable after rollback.',
        'Keep internal diagnostics accessible during rollout.'
      ],
      issues: input.hosting.blockerGroups.flatMap((group) => group.blockers)
    }
  ];
}
