import { appConfig } from '@/lib/config';
import { mediaStorageRoot } from '@/lib/media/local-storage';
import type { BackupReadiness, OperationalIssue } from '@/types/operations';

function backupPath() {
  const segments = appConfig.backup.directory
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment && segment !== '.' && segment !== '..');

  if (segments[0] === 'backups') {
    segments.shift();
  }

  return [process.cwd(), 'backups', ...segments].join('\\');
}

export function getBackupReadiness(): BackupReadiness {
  const issues: OperationalIssue[] = [];
  const notes = [
    'Database backups use pg_dump and include PostgreSQL content, submissions, reviews, media metadata, auth sessions, analytics events, and ad placement records.',
    'Local media binary files are outside PostgreSQL and must be copied with the backup bundle while local-dev storage is active.',
    'Cloud media storage should be backed up through the object-storage provider once S3/R2 uploads are activated.'
  ];

  if (!appConfig.databaseConfigured) {
    issues.push({
      id: 'backup-database-url-missing',
      area: 'backups',
      severity: 'critical',
      message: 'DATABASE_URL is required before database backup scripts can run.',
      action: 'Configure DATABASE_URL for the target PostgreSQL database.'
    });
  }

  if (appConfig.productionLike && appConfig.backup.directory === 'backups') {
    issues.push({
      id: 'backup-directory-default',
      area: 'backups',
      severity: 'warning',
      message: 'Backups are configured to use the local default backup directory.',
      action: 'Set PIXLO_BACKUP_DIRECTORY to a durable mounted volume or backup workspace.'
    });
  }

  if (appConfig.productionLike && appConfig.media.storageProvider === 'local-dev') {
    issues.push({
      id: 'backup-local-media-production-like',
      area: 'backups',
      severity: 'warning',
      message: 'Local media storage requires filesystem backup coverage.',
      action: `Include ${mediaStorageRoot} in backup jobs, or move media to S3/R2 storage before launch.`
    });
  }

  return {
    status: issues.some((issue) => issue.severity === 'critical')
      ? 'incomplete'
      : appConfig.productionLike
        ? 'configured'
        : 'local-ready',
    databaseConfigured: appConfig.databaseConfigured,
    backupDirectory: backupPath(),
    pgDumpCommand: appConfig.backup.pgDumpCommand,
    pgRestoreCommand: appConfig.backup.pgRestoreCommand,
    psqlCommand: appConfig.backup.psqlCommand,
    retentionDays: appConfig.backup.retentionDays,
    includesMediaMetadata: true,
    includesLocalMediaFiles: appConfig.media.storageProvider === 'local-dev',
    notes,
    issues
  };
}
