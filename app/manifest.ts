import type { MetadataRoute } from 'next';
import { appConfig } from '@/lib/config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PixloGames',
    short_name: 'PixloGames',
    description: appConfig.defaultDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#07090d',
    theme_color: '#07090d',
    categories: ['games', 'entertainment'],
    lang: 'en'
  };
}
