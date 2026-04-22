import type { Metadata } from 'next';
import Link from 'next/link';
import { InternalAccessPanel } from '@/components/internal/internal-access-panel';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { requireAnyInternalSession } from '@/lib/auth/session';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata(
  'Access Blocked',
  'PixloGames internal access blocked for the current role.',
  {
    path: '/internal/forbidden',
    noIndex: true
  }
);

export default async function InternalForbiddenPage() {
  const session = await requireAnyInternalSession();

  return (
    <main>
      <PageContainer className="space-y-8 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <Pill tone="ember">Access blocked</Pill>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
            This internal area needs a different role.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Your session is valid, but your current role does not include permission for this
            operation. Use another internal section or sign in with an authorized account.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-bold text-black transition hover:bg-brand-strong"
              href="/internal/submissions"
            >
              Review submissions
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] px-4 text-sm font-bold text-foreground transition hover:border-white/20 hover:bg-white/[0.12]"
              href="/"
            >
              Return home
            </Link>
          </div>
        </section>
        <InternalAccessPanel session={session} />
      </PageContainer>
    </main>
  );
}
