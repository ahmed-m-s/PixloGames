'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';

type GlobalErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'client_route_error',
        message: error.message,
        digest: error.digest
      })
    );
  }, [error]);

  return (
    <main>
      <PageContainer className="py-16 sm:py-20">
        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-10">
          <Pill tone="ember">Something broke</Pill>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
            PixloGames hit a temporary snag.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Try again once. If it keeps happening, the diagnostics layer will help trace the failing
            route.
          </p>
          <Button className="mt-6" onClick={reset}>
            Try again
          </Button>
        </section>
      </PageContainer>
    </main>
  );
}
