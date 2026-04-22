'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type ShareButtonProps = {
  title: string;
  text: string;
};

export function ShareButton({ title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleShare() {
    const url = window.location.href;

    setErrorMessage('');

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }

      if (!navigator.clipboard) {
        throw new Error('Clipboard unavailable');
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      setErrorMessage('Unable to share right now');
      window.setTimeout(() => setErrorMessage(''), 2400);
    }
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={handleShare} variant="secondary">
        {copied ? 'Link copied' : 'Share'}
      </Button>
      {errorMessage ? <p className="text-xs font-semibold text-ember">{errorMessage}</p> : null}
    </div>
  );
}
