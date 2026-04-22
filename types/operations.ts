export type OperationalSeverity = 'info' | 'warning' | 'critical';
export type OperationalStatus = 'ready' | 'watch' | 'blocked';
export type EnvironmentMode = 'local' | 'preview' | 'staging' | 'production';
export type RolloutStage = 'local' | 'private_beta' | 'public_beta' | 'production';
export type HostingTarget = 'local-dev' | 'vps' | 'managed-node' | 'container' | 'platform';
export type RolloutGateStatus =
  | 'local_safe'
  | 'beta_ready'
  | 'beta_watch'
  | 'production_ready'
  | 'production_blocked';

export type OperationalIssue = {
  id: string;
  area: string;
  severity: OperationalSeverity;
  message: string;
  action: string;
};

export type LaunchReadinessArea =
  | 'deployment'
  | 'database'
  | 'security'
  | 'auth'
  | 'publishing'
  | 'media'
  | 'analytics'
  | 'monetization'
  | 'seo'
  | 'backups'
  | 'monitoring';

export type LaunchReadinessItem = {
  area: LaunchReadinessArea;
  label: string;
  status: OperationalStatus;
  summary: string;
  checks: string[];
  issues: OperationalIssue[];
};

export type DeploymentProfile = {
  environmentMode: EnvironmentMode;
  deploymentTarget: string;
  hostingTarget: HostingTarget;
  rolloutStage: RolloutStage;
  publicLaunchEnabled: boolean;
  productionLike: boolean;
  stagingLike: boolean;
  appVersion: string;
  buildId?: string;
};

export type RolloutGate = {
  status: RolloutGateStatus;
  label: string;
  controlledBetaReady: boolean;
  productionReady: boolean;
  blockers: OperationalIssue[];
  warnings: OperationalIssue[];
  notes: string[];
};

export type ProviderRequirementArea = 'media' | 'analytics' | 'alerts' | 'monetization';
export type ProviderRequirementStatus = 'satisfied' | 'warning' | 'blocked';
export type ProviderRequirement = {
  area: ProviderRequirementArea;
  label: string;
  mode: string;
  activationState: string;
  status: ProviderRequirementStatus;
  requiredFor: 'local' | 'preview' | 'staging' | 'production' | 'optional';
  summary: string;
  action: string;
};

export type HostingEnvGroup = {
  id: string;
  label: string;
  requiredFor: 'local' | 'private_beta' | 'public_beta' | 'production' | 'optional';
  status: OperationalStatus;
  variables: string[];
  summary: string;
};

export type RolloutStageReadiness = {
  stage: 'private_beta' | 'public_beta' | 'production';
  label: string;
  status: OperationalStatus;
  summary: string;
  checks: string[];
  blockers: OperationalIssue[];
  warnings: OperationalIssue[];
};

export type LaunchBlockerGroup = {
  id: 'infrastructure' | 'providers' | 'content' | 'monitoring' | 'operations';
  title: string;
  blockers: OperationalIssue[];
  warnings: OperationalIssue[];
};

export type HostingTargetReadiness = {
  target: HostingTarget;
  label: string;
  status: OperationalStatus;
  deploymentClass: 'local' | 'self-hosted' | 'managed' | 'containerized' | 'platform';
  summary: string;
  assumptions: string[];
  envGroups: HostingEnvGroup[];
  rolloutStages: RolloutStageReadiness[];
  blockerGroups: LaunchBlockerGroup[];
  smokeChecks: string[];
  handoffGuidance: string[];
  recommendedNextStep: string;
};

export type DeploymentArtifactKind =
  | 'env-template'
  | 'container-template'
  | 'process-template'
  | 'smoke-script'
  | 'operator-doc'
  | 'runtime-command';

export type DeploymentArtifactStatus = 'ready' | 'template' | 'local-only';

export type DeploymentArtifact = {
  id: string;
  label: string;
  kind: DeploymentArtifactKind;
  status: DeploymentArtifactStatus;
  target: HostingTarget | 'all';
  path: string;
  summary: string;
  commands: string[];
  notes: string[];
};

export type DeploymentCommandGroup = {
  label: string;
  target: HostingTarget | 'all';
  commands: string[];
  purpose: string;
};

export type DeploymentExecutionPlan = {
  artifacts: DeploymentArtifact[];
  commandGroups: DeploymentCommandGroup[];
  reverseProxyNotes: string[];
  startupShutdownNotes: string[];
  postDeploySmokeChecks: string[];
};

export type SecurityReadiness = {
  status: OperationalStatus;
  sessionHours: number;
  secureCookies: boolean;
  sameSitePolicy: 'strict';
  csrfProtectionEnabled: boolean;
  csrfSecretConfigured: boolean;
  checks: string[];
  issues: OperationalIssue[];
};

export type BetaReleaseChecklistGroup = {
  title: string;
  status: OperationalStatus;
  items: string[];
  issues: OperationalIssue[];
};

export type BackupReadinessStatus = 'configured' | 'local-ready' | 'incomplete';

export type BackupReadiness = {
  status: BackupReadinessStatus;
  databaseConfigured: boolean;
  backupDirectory: string;
  pgDumpCommand: string;
  pgRestoreCommand: string;
  psqlCommand: string;
  retentionDays: number;
  includesMediaMetadata: boolean;
  includesLocalMediaFiles: boolean;
  notes: string[];
  issues: OperationalIssue[];
};
