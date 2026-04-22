'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

type CategoryOpenTrackerProps = {
  category: string;
  slug: string;
};

export function CategoryOpenTracker({ category, slug }: CategoryOpenTrackerProps) {
  useEffect(() => {
    trackEvent('category_opened', {
      category,
      slug
    });
  }, [category, slug]);

  return null;
}
