import type { Metadata } from 'next';
import { absoluteUrl, appConfig } from '@/lib/config';

type PageMetadataOptions = {
  path?: string;
  image?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
};

export function createPageMetadata(
  title: string,
  description = appConfig.defaultDescription,
  options: PageMetadataOptions = {}
): Metadata {
  const fullTitle = title.includes(appConfig.siteName) ? title : `${title} - ${appConfig.siteName}`;
  const canonical = options.path ? absoluteUrl(options.path) : appConfig.siteUrl;
  const image = options.image
    ? options.image.startsWith('http')
      ? options.image
      : absoluteUrl(options.image)
    : undefined;

  return {
    metadataBase: new URL(appConfig.siteUrl),
    title: fullTitle,
    description,
    alternates: {
      canonical
    },
    robots: options.noIndex
      ? {
          index: false,
          follow: true
        }
      : {
          index: true,
          follow: true
        },
    openGraph: {
      title: fullTitle,
      description,
      siteName: appConfig.siteName,
      type: options.type ?? 'website',
      url: canonical,
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630
            }
          ]
        : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: image ? [image] : undefined
    }
  };
}
