'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { trackEvent } from '@/lib/analytics';

export function HeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get('q') ?? '';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const trimmedQuery = String(formData.get('q') ?? '').trim();

    if (!trimmedQuery) {
      router.push('/search');
      return;
    }

    trackEvent('search_used', {
      query: trimmedQuery,
      source: 'header'
    });
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="relative block">
        <span className="sr-only">Search games</span>
        <input
          className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.08] px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted/70 focus:border-brand/[0.55] focus:bg-white/[0.12]"
          defaultValue={currentQuery}
          key={currentQuery}
          name="q"
          placeholder="Search action, racing, puzzle..."
          type="search"
        />
      </label>
    </form>
  );
}
