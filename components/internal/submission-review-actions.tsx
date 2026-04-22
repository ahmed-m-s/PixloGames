'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import type { SubmissionAdminAction } from '@/types/schema';
import type { SubmissionStatus } from '@/types/submission';

type SubmissionReviewActionsProps = {
  csrfToken: string;
  submissionId: string;
  currentStatus: SubmissionStatus;
};

const actions: { action: SubmissionAdminAction; label: string; tone: 'primary' | 'secondary' }[] = [
  { action: 'in_review', label: 'Mark in review', tone: 'secondary' },
  { action: 'needs_changes', label: 'Needs changes', tone: 'secondary' },
  { action: 'approve', label: 'Approve', tone: 'primary' },
  { action: 'reject', label: 'Reject', tone: 'secondary' }
];

export function SubmissionReviewActions({
  csrfToken,
  submissionId,
  currentStatus
}: SubmissionReviewActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<SubmissionAdminAction | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  async function submitAction(action: SubmissionAdminAction, reviewNote: string) {
    setPendingAction(action);
    setMessage(undefined);
    setError(undefined);

    const response = await fetch('/api/internal/submissions', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Pixlo-CSRF': csrfToken
      },
      body: JSON.stringify({
        submissionId,
        action,
        reviewNote
      })
    });
    const body = await response.json();

    setPendingAction(undefined);

    if (!response.ok || !body.ok) {
      setError(body.error?.message ?? 'Review action failed.');
      return;
    }

    setMessage('Review action saved.');
    router.refresh();
  }

  async function handleNoteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const reviewNote = String(formData.get('reviewNote') ?? '').trim();

    if (!reviewNote) {
      setError('Write a review note before saving.');
      return;
    }

    await submitAction('add_note', reviewNote);
    event.currentTarget.reset();
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
      <p className="font-display text-xl font-bold text-foreground">Review actions</p>
      <p className="mt-2 text-sm leading-6 text-muted">
        Current status: <span className="font-bold text-foreground">{currentStatus}</span>
      </p>

      {message ? (
        <div className="mt-4 rounded-lg border border-brand/25 bg-brand/[0.1] p-3 text-sm font-semibold text-brand">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-lg border border-ember/30 bg-ember/[0.1] p-3 text-sm font-semibold text-ember">
          {error}
        </div>
      ) : null}

      <form className="mt-4 space-y-4" onSubmit={handleNoteSubmit}>
        <label className="block">
          <span className="text-sm font-bold text-foreground">Reviewer note</span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-lg border border-white/10 bg-black/[0.25] px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand/[0.55]"
            name="reviewNote"
            placeholder="What changed, what is blocked, or what the developer needs to address"
          />
        </label>
        <Button disabled={Boolean(pendingAction)} type="submit" variant="secondary">
          {pendingAction === 'add_note' ? 'Saving note...' : 'Add note'}
        </Button>
      </form>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {actions.map((action) => (
          <Button
            disabled={Boolean(pendingAction)}
            key={action.action}
            onClick={() => submitAction(action.action, `${action.label} from review detail.`)}
            variant={action.tone}
          >
            {pendingAction === action.action ? 'Saving...' : action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
