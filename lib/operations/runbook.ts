export const operationsRunbook = [
  {
    area: 'Database outage',
    checks: [
      'Confirm PostgreSQL service or managed database status first.',
      'Check DATABASE_URL in the deployment environment.',
      'Run the health endpoint and verify database reachability before restarting app workers.'
    ]
  },
  {
    area: 'Upload failures',
    checks: [
      'Check the media provider mode in internal diagnostics.',
      'For local-dev storage, verify the storage/media directory is writable.',
      'For S3/R2-ready modes, verify bucket, public base URL, endpoint, and credentials.'
    ]
  },
  {
    area: 'Publishing blocked',
    checks: [
      'Open the submission or game detail in internal tools and review readiness blockers.',
      'Confirm thumbnail and cover assets are present.',
      'Confirm moderation, QA, source, and rights criteria are passing before retrying.'
    ]
  },
  {
    area: 'Analytics delivery failures',
    checks: [
      'Keep PostgreSQL analytics logging enabled while investigating provider outages.',
      'Check external analytics endpoint and write key only if external-ready mode is selected.',
      'Review analytics_delivery_failed events in diagnostics for recent provider errors.'
    ]
  },
  {
    area: 'Ad provider missing config',
    checks: [
      'Public slots remain non-invasive while ad serving is disabled or placeholder-only.',
      'For external-ready ad mode, configure ad server endpoint and publisher ID.',
      'Keep sponsored and featured content labels separate from future ad-served placements.'
    ]
  },
  {
    area: 'Restore drill',
    checks: [
      'Restore PostgreSQL from a pg_dump custom-format backup into a disposable database first.',
      'Copy local media files back to storage/media when local-dev media storage was used.',
      'Run /api/health and internal launch readiness after any restore.'
    ]
  }
] as const;
