export type AnalyticsEventName =
  | 'game_click'
  | 'game_open'
  | 'favorite_added'
  | 'favorite_removed'
  | 'search_used'
  | 'filter_applied'
  | 'category_opened'
  | 'submission_created'
  | 'submission_reviewed'
  | 'game_published'
  | 'game_unpublished'
  | 'analytics_provider_test'
  | 'analytics_delivery_failed';

export type AnalyticsScalar = string | number | boolean | null | undefined;

export type AnalyticsEventPayloads = {
  game_click: {
    gameId: string;
    slug?: string;
    title?: string;
    placement?: string;
  };
  game_open: {
    gameId: string;
    slug?: string;
    title?: string;
  };
  favorite_added: {
    gameId: string;
  };
  favorite_removed: {
    gameId: string;
  };
  search_used: {
    query: string;
  };
  filter_applied: {
    filter: string;
    value?: string;
  };
  category_opened: {
    category: string;
    slug?: string;
  };
  submission_created: {
    submissionId: string;
    category?: string;
    sourceType?: string;
  };
  submission_reviewed: {
    submissionId: string;
    action: string;
    status?: string;
  };
  game_published: {
    gameId: string;
    slug?: string;
    sourceSubmissionId?: string;
  };
  game_unpublished: {
    gameId: string;
    slug?: string;
    sourceSubmissionId?: string;
  };
  analytics_provider_test: {
    mode: string;
    externalConfigured: boolean;
    requestedBy?: string;
  };
  analytics_delivery_failed: {
    sourceEvent: string;
    provider: string;
    reason?: string;
  };
};

export type AnalyticsPayload<Name extends AnalyticsEventName = AnalyticsEventName> = Partial<
  AnalyticsEventPayloads[Name]
> &
  Record<string, AnalyticsScalar>;

export type AnalyticsEvent<Name extends AnalyticsEventName = AnalyticsEventName> = {
  name: Name;
  payload: AnalyticsPayload<Name>;
  timestamp: string;
};

export type AnalyticsProvider = {
  name: string;
  track: (event: AnalyticsEvent) => void | Promise<void>;
};

declare global {
  interface Window {
    pixloAnalyticsQueue?: AnalyticsEvent[];
  }
}

const browserQueueProvider: AnalyticsProvider = {
  name: 'browser-dev-queue',
  track(event) {
    window.pixloAnalyticsQueue = [...(window.pixloAnalyticsQueue ?? []), event].slice(-100);

    if (process.env.NODE_ENV !== 'production') {
      console.info('[Pixlo analytics]', event);
    }
  }
};

export function trackEvent<Name extends AnalyticsEventName>(
  name: Name,
  payload: AnalyticsPayload<Name> = {}
) {
  if (typeof window === 'undefined') {
    return;
  }

  const event: AnalyticsEvent<Name> = {
    name,
    payload,
    timestamp: new Date().toISOString()
  };

  void browserQueueProvider.track(event);
}
