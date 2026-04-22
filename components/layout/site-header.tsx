import Link from 'next/link';
import { Suspense } from 'react';
import { HeaderSearch } from '@/components/layout/header-search';
import { PageContainer } from '@/components/ui/page-container';

const navItems = [
  { label: 'Originals', href: '/originals' },
  { label: 'Games', href: '/games' },
  { label: 'New', href: '/games?sort=newest&new=1' },
  { label: 'Categories', href: '/categories' },
  { label: 'Favorites', href: '/favorites' },
  { label: 'Recent', href: '/recently-played' }
];

const developerCta = {
  label: 'Submit Game',
  href: '/developers/submit-game'
};

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-page/[0.82] backdrop-blur-xl">
      <PageContainer>
        <div className="flex min-h-20 flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link className="group flex items-center gap-3" href="/">
              <span className="grid h-10 w-10 grid-cols-2 gap-1 rounded-lg border border-white/[0.12] bg-white/[0.08] p-1.5 shadow-card">
                <span className="rounded-[4px] bg-brand" />
                <span className="rounded-[4px] bg-ember" />
                <span className="rounded-[4px] bg-aqua" />
                <span className="rounded-[4px] bg-sun" />
              </span>
              <span>
                <span className="block font-display text-xl font-bold leading-none tracking-tight text-foreground">
                  PixloGames
                </span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Play instantly
                </span>
              </span>
            </Link>
            <Link
              className="rounded-lg bg-brand px-3 py-2 text-sm font-bold text-black transition hover:bg-brand-strong lg:hidden"
              href="/games"
            >
              Play
            </Link>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(300px,420px)_auto] lg:items-center">
            <Suspense
              fallback={
                <div className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.07]" />
              }
            >
              <HeaderSearch />
            </Suspense>
            <nav
              aria-label="Primary navigation"
              className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex min-w-max items-center gap-1 lg:min-w-0 lg:flex-wrap lg:justify-end">
                {navItems.map((item) => (
                  <Link
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-white/[0.08] hover:text-foreground"
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  className="ml-1 rounded-lg border border-brand/35 bg-brand/[0.08] px-3 py-2 text-sm font-bold text-foreground transition hover:border-brand/55 hover:bg-brand/[0.14] hover:text-brand"
                  href={developerCta.href}
                >
                  {developerCta.label}
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </PageContainer>
    </header>
  );
}
