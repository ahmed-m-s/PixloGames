import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { getInternalSession } from '@/lib/auth/session';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata(
  'Internal Sign In',
  'Secure internal access for PixloGames operations, submissions, and content management.',
  {
    path: '/internal/sign-in',
    noIndex: true
  }
);

type InternalSignInPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
    signedOut?: string;
  }>;
};

function getSafeNextPath(next?: string) {
  if (next?.startsWith('/internal') && next !== '/internal/sign-in') {
    return next;
  }

  return '/internal/games';
}

export default async function InternalSignInPage({ searchParams }: InternalSignInPageProps) {
  const [params, session] = await Promise.all([searchParams, getInternalSession()]);
  const nextPath = getSafeNextPath(params.next);

  if (session) {
    redirect(nextPath);
  }

  return (
    <main>
      <PageContainer className="grid min-h-[calc(100vh-180px)] place-items-center py-10 sm:py-12 lg:py-14">
        <section className="w-full max-w-xl rounded-lg border border-white/10 bg-white/[0.05] p-6 shadow-card sm:p-8">
          <Pill tone="brand">Internal tools</Pill>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
            Sign in to Pixlo Operations
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
            Admin access is limited to internal content, submission, and curation workflows. This
            phase uses PostgreSQL-backed local credentials and durable sessions.
          </p>

          {params.error === 'invalid' ? (
            <div className="mt-5 rounded-lg border border-ember/30 bg-ember/[0.1] p-4 text-sm font-semibold text-ember">
              The email or password did not match an active internal user.
            </div>
          ) : null}

          {params.signedOut ? (
            <div className="mt-5 rounded-lg border border-aqua/25 bg-aqua/[0.08] p-4 text-sm font-semibold text-aqua">
              You have been signed out.
            </div>
          ) : null}

          <form action="/api/internal/auth/sign-in" className="mt-6 space-y-4" method="post">
            <input name="next" type="hidden" value={nextPath} />
            <label className="block">
              <span className="text-sm font-bold text-foreground">Email</span>
              <input
                autoComplete="email"
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/[0.25] px-4 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand/[0.55]"
                defaultValue="admin@pixlogames.local"
                name="email"
                required
                type="email"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-foreground">Password</span>
              <input
                autoComplete="current-password"
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/[0.25] px-4 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand/[0.55]"
                name="password"
                placeholder="Internal password"
                required
                type="password"
              />
            </label>
            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand px-4 text-sm font-bold text-black transition hover:bg-brand-strong"
              type="submit"
            >
              Sign in
            </button>
          </form>

          <p className="mt-5 text-xs leading-5 text-muted">
            Local development seed credentials are controlled by
            <span className="font-bold text-foreground"> PIXLO_INTERNAL_ADMIN_EMAIL </span>
            and
            <span className="font-bold text-foreground"> PIXLO_INTERNAL_ADMIN_PASSWORD</span>.
          </p>
        </section>
      </PageContainer>
    </main>
  );
}
