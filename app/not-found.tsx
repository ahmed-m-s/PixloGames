import Link from 'next/link';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';

export default function NotFound() {
  return (
    <main>
      <PageContainer className="py-16 sm:py-20">
        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-10">
          <Pill tone="ember">Not found</Pill>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
            This page slipped out of the arcade.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            The game, category, or internal route you requested is not available at this address.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-bold text-black transition hover:bg-brand-strong"
              href="/games"
            >
              Browse games
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] px-5 text-sm font-bold text-foreground transition hover:border-white/20 hover:bg-white/[0.12]"
              href="/"
            >
              Go home
            </Link>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
