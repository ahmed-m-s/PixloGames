import type { Metadata } from 'next';
import { Fredoka } from 'next/font/google';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { appConfig } from '@/lib/config';
import './globals.css';

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.siteUrl),
  applicationName: appConfig.siteName,
  title: 'PixloGames - Play HTML5 Browser Games Instantly',
  description:
    'Discover premium HTML5 browser games across action, racing, puzzle, arcade, multiplayer, and more.',
  alternates: {
    canonical: appConfig.siteUrl
  },
  openGraph: {
    title: 'PixloGames - Play HTML5 Browser Games Instantly',
    description:
      'Discover premium HTML5 browser games across action, racing, puzzle, arcade, multiplayer, and more.',
    siteName: appConfig.siteName,
    type: 'website',
    url: appConfig.siteUrl
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PixloGames - Play HTML5 Browser Games Instantly',
    description:
      'Discover premium HTML5 browser games across action, racing, puzzle, arcade, multiplayer, and more.'
  }
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body className={fredoka.variable}>
        <div className="min-h-screen bg-page text-foreground">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
