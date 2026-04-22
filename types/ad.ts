export type AdPlacementKey = 'homepage-inline' | 'between-section' | 'game-sidebar';
export type AdProviderMode = 'disabled' | 'local-placeholder' | 'external-ready';
export type AdInventoryClass = 'organic' | 'featured' | 'sponsored' | 'ad-served';

export type AdPlacement = {
  id: string;
  placementKey: AdPlacementKey;
  label: string;
  enabled: boolean;
  sponsoredOnly: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdSlotOperationalState = {
  provider: AdProviderMode;
  inventoryClass: AdInventoryClass;
  label: string;
  status: 'disabled' | 'placeholder' | 'ready' | 'misconfigured';
};
