'use client';

import { useSyncExternalStore } from 'react';

function subscribeToClientReady(onStoreChange: () => void) {
  const frame = window.requestAnimationFrame(onStoreChange);

  return () => window.cancelAnimationFrame(frame);
}

function getClientReadySnapshot() {
  return true;
}

function getServerReadySnapshot() {
  return false;
}

export function useClientReady() {
  return useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot
  );
}
