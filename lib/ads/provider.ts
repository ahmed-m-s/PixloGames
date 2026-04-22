import { appConfig } from '@/lib/config';
import type { AdPlacement, AdProviderMode, AdSlotOperationalState } from '@/types/ad';

export type AdProviderStatus = 'operational' | 'disabled' | 'scaffold' | 'misconfigured';

export type AdProviderDiagnostics = {
  mode: AdProviderMode;
  label: string;
  status: AdProviderStatus;
  activationState:
    | 'disabled'
    | 'local-only'
    | 'configured-active'
    | 'configured-inactive'
    | 'misconfigured';
  externalConfigured: boolean;
  enabledPlacements: number;
  sponsoredOnlyPlacements: number;
  warnings: string[];
};

export function getAdSlotOperationalState(input: {
  enabled?: boolean;
  sponsoredOnly?: boolean;
}): AdSlotOperationalState {
  if (appConfig.ads.provider === 'disabled' || !input.enabled) {
    return {
      provider: appConfig.ads.provider,
      inventoryClass: input.sponsoredOnly ? 'sponsored' : 'organic',
      label: 'Disabled',
      status: 'disabled'
    };
  }

  if (appConfig.ads.provider === 'external-ready') {
    const configured = Boolean(appConfig.ads.externalEndpoint && appConfig.ads.publisherId);

    return {
      provider: 'external-ready',
      inventoryClass: configured ? 'ad-served' : 'sponsored',
      label: configured ? 'Ad server ready' : 'Ad server config needed',
      status: configured ? 'ready' : 'misconfigured'
    };
  }

  return {
    provider: 'local-placeholder',
    inventoryClass: input.sponsoredOnly ? 'sponsored' : 'featured',
    label: 'Local placeholder',
    status: 'placeholder'
  };
}

export function getAdProviderDiagnostics(
  placements: Pick<AdPlacement, 'enabled' | 'sponsoredOnly'>[] = []
): AdProviderDiagnostics {
  const enabledPlacements = placements.filter((placement) => placement.enabled).length;
  const sponsoredOnlyPlacements = placements.filter((placement) => placement.sponsoredOnly).length;
  const externalConfigured = Boolean(appConfig.ads.externalEndpoint && appConfig.ads.publisherId);
  const warnings: string[] = [];

  if (appConfig.ads.provider === 'external-ready' && !externalConfigured) {
    warnings.push(
      'External ad provider mode is selected but endpoint or publisher config is missing.'
    );
  }

  if (appConfig.ads.provider === 'local-placeholder' && externalConfigured) {
    warnings.push(
      'External ad server config is present, but local placeholder monetization mode is active.'
    );
  }

  if (placements.length > 0 && appConfig.ads.provider !== 'disabled' && enabledPlacements === 0) {
    warnings.push('No ad placements are enabled for monetization testing.');
  }

  return {
    mode: appConfig.ads.provider,
    label:
      appConfig.ads.provider === 'external-ready'
        ? 'External ad server scaffold'
        : appConfig.ads.provider === 'disabled'
          ? 'Ad serving disabled'
          : 'Local sponsorship placeholders',
    status:
      appConfig.ads.provider === 'disabled'
        ? 'disabled'
        : appConfig.ads.provider === 'external-ready'
          ? externalConfigured
            ? 'scaffold'
            : 'misconfigured'
          : 'operational',
    activationState:
      appConfig.ads.provider === 'disabled'
        ? 'disabled'
        : appConfig.ads.provider === 'external-ready'
          ? externalConfigured
            ? 'configured-active'
            : 'misconfigured'
          : externalConfigured
            ? 'configured-inactive'
            : 'local-only',
    externalConfigured,
    enabledPlacements,
    sponsoredOnlyPlacements,
    warnings
  };
}
