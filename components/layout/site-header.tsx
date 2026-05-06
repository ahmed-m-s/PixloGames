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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-page/[0.88] shadow-[0_12px_38px_rgb(0_0_0_/_0.26)] backdrop-blur-xl">
      <PageContainer>
        <div className="grid gap-2 py-2 lg:grid-cols-[auto_minmax(260px,420px)_1fr] lg:items-center lg:gap-4">
          <div className="flex items-center justify-between gap-3">
            <Link className="group flex items-center gap-3" href="/">
              <span className="grid h-9 w-9 grid-cols-2 gap-1 rounded-lg border border-white/[0.12] bg-white/[0.08] p-1.5 shadow-card transition group-hover:border-brand/35">
                <span className="rounded-[4px] bg-brand" />
                <span className="rounded-[4px] bg-ember" />
                <span className="rounded-[4px] bg-aqua" />
                <span className="rounded-[4px] bg-sun" />
              </span>
              <span>
                <span className="block font-display text-lg font-bold leading-none text-foreground sm:text-xl">
                  PixloGames
                </span>
                <span className="mt-0.5 block text-xs font-semibold uppercase text-brand/80">
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

          <Suspense
            fallback={
              <div className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.07]" />
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
                  className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted transition hover:bg-white/[0.08] hover:text-foreground"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                className="ml-1 rounded-lg border border-brand/35 bg-brand/[0.08] px-2.5 py-1.5 text-sm font-bold text-foreground transition hover:border-brand/55 hover:bg-brand/[0.14] hover:text-brand"
                href={developerCta.href}
              >
                {developerCta.label}
              </Link>
            </div>
          </nav>
        </div>
      </PageContainer>
    </header>
  );
}
