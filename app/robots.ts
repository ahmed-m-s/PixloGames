import type { MetadataRoute } from 'next';
import { absoluteUrl, appConfig } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/games', '/originals', '/categories', '/developers/submit-game'],
        disallow: ['/internal', '/api/internal', '/api/media']
      }
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: appConfig.siteUrl
  };
}
