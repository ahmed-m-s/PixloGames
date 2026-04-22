'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { PublishingAction } from '@/types/schema';

type PublishingActionsProps = {
  csrfToken: string;
  submissionId?: string;
  gameId?: string;
  canCreateDraft?: boolean;
  canPublish?: boolean;
  compact?: boolean;
};

type ActionButton = {
  action: PublishingAction;
  label: string;
  tone: 'primary' | 'secondary';
  disabled?: boolean;
  payload?: {
    featuredPriority?: number;
    sponsoredPriority?: number;
  };
};

export function PublishingActions({
  csrfToken,
  submissionId,
  gameId,
  canCreateDraft = false,
  canPublish = false,
  compact = false
}: PublishingActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PublishingAction | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const actions: ActionButton[] = submissionId
    ? [
        {
          action: 'create_draft_from_submission',
          label: 'Create game draft',
          tone: 'primary',
          disabled: !canCreateDraft
        }
      ]
    : [
        {
          action: 'publish_game',
          label: 'Publish',
          tone: 'primary',
          disabled: !canPublish
        },
        {
          action: 'save_game_draft',
          label: 'Save as draft',
          tone: 'secondary'
        },
        {
          action: 'unpublish_game',
          label: 'Unpublish',
          tone: 'secondary'
        },
        {
          action: 'promote_featured',
          label: 'Feature',
          tone: 'secondary',
          payload: {
            featuredPriority: 90
          }
        },
        {
          action: 'mark_sponsored_eligible',
          label: 'Sponsor eligible',
          tone: 'secondary',
          payload: {
            sponsoredPriority: 60
          }
        }
      ];

  async function runAction(action: ActionButton) {
    setPendingAction(action.action);
    setMessage(undefined);
    setError(undefined);

    const response = await fetch('/api/internal/publishing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pixlo-CSRF': csrfToken
      },
      body: JSON.stringify({
        action: action.action,
        submissionId,
        gameId,
        ...action.payload
      })
    });
    const body = await response.json();

    setPendingAction(undefined);

    if (!response.ok || !body.ok) {
      setError(body.error?.issues?.[0] ?? body.error?.message ?? 'Publishing action failed.');
      return;
    }

    setMessage(body.data?.note ?? 'Publishing action saved.');
    router.refresh();
  }

  return (
    <div
      className={compact ? 'space-y-3' : 'rounded-lg border border-white/10 bg-white/[0.05] p-5'}
    >
      {!compact ? (
        <>
          <p className="font-display text-xl font-bold text-foreground">Publishing controls</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Protected operations for draft creation, publication state, featured priority, and
            sponsored eligibility.
          </p>
        </>
      ) : null}

      {message ? (
        <div className="mt-3 rounded-lg border border-brand/25 bg-brand/[0.1] p-3 text-sm font-semibold text-brand">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-lg border border-ember/30 bg-ember/[0.1] p-3 text-sm font-semibold text-ember">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {actions.map((action) => (
          <Button
            disabled={Boolean(pendingAction) || action.disabled}
            key={action.action}
            onClick={() => runAction(action)}
            variant={action.tone}
          >
            {pendingAction === action.action ? 'Saving...' : action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
