import Link from 'next/link';
import { PageContainer } from '@/components/ui/page-container';

const footerGroups = [
  {
    title: 'Play',
    links: [
      { id: 'games', label: 'Games', href: '/games' },
      { id: 'originals', label: 'Pixlo Originals', href: '/originals' },
      { id: 'categories', label: 'Categories', href: '/categories' },
      { id: 'new', label: 'New releases', href: '/games?sort=newest&new=1' },
      { id: 'editors', label: "Editor's picks", href: '/games?sort=featured&editors=1' }
    ]
  },
  {
    title: 'Developers',
    links: [
      { id: 'developers', label: 'Developers', href: '/developers/submit-game' },
      { id: 'submit-game', label: 'Submit Game', href: '/developers/submit-game#submission-form' },
      {
        id: 'submission-guidelines',
        label: 'Submission Guidelines',
        href: '/developers/submit-game#submission-guidelines'
      }
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/[0.22]">
      <PageContainer className="py-10 sm:py-12">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
          <div className="max-w-2xl">
            <Link className="inline-flex items-center gap-3" href="/">
              <span className="grid h-9 w-9 grid-cols-2 gap-1 rounded-lg border border-white/[0.12] bg-white/[0.08] p-1.5">
                <span className="rounded-[4px] bg-brand" />
                <span className="rounded-[4px] bg-ember" />
                <span className="rounded-[4px] bg-aqua" />
                <span className="rounded-[4px] bg-sun" />
              </span>
              <span className="font-display text-lg font-bold">PixloGames</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-muted">
              A modern HTML5 browser games platform built for fast discovery, rich thumbnails, clean
              categories, and instant play across devices. Developers can submit polished HTML5
              games for review and future publishing.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 text-xs font-bold uppercase tracking-[0.14em] text-foreground">
                  {group.title}
                </p>
                <div className="mt-2 grid gap-1">
                  {group.links.map((link) => (
                    <Link
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-white/[0.08] hover:text-foreground"
                      href={link.href}
                      key={link.id}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 PixloGames. All rights reserved.</p>
          <p>Built for instant HTML5 play.</p>
        </div>
      </PageContainer>
    </footer>
  );
}
