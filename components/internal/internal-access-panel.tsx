import Link from 'next/link';
import { createInternalCsrfToken } from '@/lib/auth/csrf';
import { getRolePermissions } from '@/lib/auth/permissions';
import type { InternalSession } from '@/types/auth';

type InternalAccessPanelProps = {
  session: InternalSession;
  title?: string;
};

export function InternalAccessPanel({
  session,
  title = 'Internal access'
}: InternalAccessPanelProps) {
  const permissions = getRolePermissions(session.user.role);
  const csrfToken = createInternalCsrfToken(session);

  return (
    <section className="rounded-lg border border-white/10 bg-black/[0.22] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{title}</p>
          <p className="mt-2 text-sm font-bold text-foreground">
            {session.user.name} - {session.user.role}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted">{session.user.email}</p>
          <p className="mt-1 text-xs font-semibold text-muted">
            Session expires {session.expiresAt.toLocaleString()}. Internal mutations use a signed
            session-bound CSRF token.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <span
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-muted"
                key={permission}
              >
                {permission.replaceAll('_', ' ')}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] px-4 text-sm font-bold text-foreground transition hover:border-white/20 hover:bg-white/[0.12]"
            href="/internal/readiness"
          >
            Readiness
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] px-4 text-sm font-bold text-foreground transition hover:border-white/20 hover:bg-white/[0.12]"
            href="/internal/diagnostics"
          >
            Diagnostics
          </Link>
          <form action="/api/internal/auth/sign-out" method="post">
            <input name="_csrf" type="hidden" value={csrfToken} />
            <button
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] px-4 text-sm font-bold text-foreground transition hover:border-white/20 hover:bg-white/[0.12]"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
