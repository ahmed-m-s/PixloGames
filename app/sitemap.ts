import type { MetadataRoute } from 'next';
import { categories } from '@/data/games';
import { absoluteUrl } from '@/lib/config';
import { listGames } from '@/lib/repositories/content-repository';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const games = await listGames();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      changeFrequency: 'daily',
      priority: 1
    },
    {
      url: absoluteUrl('/games'),
      changeFrequency: 'daily',
      priority: 0.95
    },
    {
      url: absoluteUrl('/originals'),
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: absoluteUrl('/categories'),
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: absoluteUrl('/developers/submit-game'),
      changeFrequency: 'monthly',
      priority: 0.5
    }
  ];
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/categories/${category.slug}`),
    changeFrequency: 'weekly',
    priority: 0.75
  }));
  const gameRoutes: MetadataRoute.Sitemap = games.map((game) => ({
    url: absoluteUrl(`/games/${game.slug}`),
    lastModified: game.updatedAt ? new Date(`${game.updatedAt}T00:00:00.000Z`) : undefined,
    changeFrequency: 'weekly',
    priority: game.isEditorsPick || game.isTrending ? 0.9 : 0.7
  }));

  return [...staticRoutes, ...categoryRoutes, ...gameRoutes];
}
