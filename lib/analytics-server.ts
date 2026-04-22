import { dispatchServerAnalyticsEvent } from '@/lib/analytics-provider';
import type { AnalyticsEvent, AnalyticsEventName, AnalyticsPayload } from '@/lib/analytics';

type ServerAnalyticsContext = {
  sessionId?: string;
  userId?: string;
};

export async function trackServerEvent<Name extends AnalyticsEventName>(
  name: Name,
  payload: AnalyticsPayload<Name>,
  context: ServerAnalyticsContext = {}
) {
  const event: AnalyticsEvent<Name> = {
    name,
    payload: {
      ...payload,
      sessionId: context.sessionId,
      userId: context.userId
    },
    timestamp: new Date().toISOString()
  };

  await dispatchServerAnalyticsEvent(event);

  if (process.env.NODE_ENV !== 'production') {
    console.info('[Pixlo server analytics]', event);
  }
}
