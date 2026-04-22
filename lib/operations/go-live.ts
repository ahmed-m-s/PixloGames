export const goLiveChecklist = [
  {
    title: 'Environment',
    items: [
      'Set PIXLO_ENVIRONMENT_MODE=production only in the real production environment.',
      'Use PIXLO_ROLLOUT_STAGE=private_beta or public_beta before production.',
      'Enable PIXLO_PUBLIC_LAUNCH_ENABLED=1 only after all production blockers are cleared.'
    ]
  },
  {
    title: 'Infrastructure',
    items: [
      'Confirm DATABASE_URL points at the production PostgreSQL database.',
      'Switch media to S3/R2-compatible storage or document local filesystem backup coverage.',
      'Run a backup dry-run and a restore drill against a disposable database.'
    ]
  },
  {
    title: 'Operations',
    items: [
      'Configure explicit internal admin seed credentials and rotate local defaults.',
      'Configure a monitoring webhook before production launch.',
      'Review analytics and ad provider modes so inactive integrations are intentional.'
    ]
  },
  {
    title: 'Rollback',
    items: [
      'Keep the last known-good database backup and media bundle available.',
      'Know how to disable public launch by removing PIXLO_PUBLIC_LAUNCH_ENABLED.',
      'Keep internal diagnostics accessible to operators during rollout.'
    ]
  }
] as const;
