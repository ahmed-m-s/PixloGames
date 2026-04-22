'use client';

import Link from 'next/link';
import { categories } from '@/data/games';
import {
  browseSortOptions,
  getAllTags,
  getBrowseHref,
  getResetBrowseState,
  hasActiveBrowseFilters
} from '@/lib/browse';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { BrowseState } from '@/types/browse';

type BrowseControlsProps = {
  pathname: string;
  state: BrowseState;
  tags?: string[];
  showCategoryFilter?: boolean;
  showTagFilter?: boolean;
  keepQueryOnReset?: boolean;
  tagLimit?: number;
};

const booleanFilters: {
  key: 'multiplayer' | 'mobile' | 'isNew' | 'editorsPick';
  label: string;
}[] = [
  { key: 'multiplayer', label: 'Multiplayer' },
  { key: 'mobile', label: 'Mobile Ready' },
  { key: 'isNew', label: 'New' },
  { key: 'editorsPick', label: "Editor's Pick" }
];

function filterClassName(active: boolean) {
  return cn(
    'rounded-lg border px-3 py-2 text-sm font-bold transition',
    active
      ? 'border-brand/30 bg-brand text-black hover:bg-brand-strong'
      : 'border-white/10 bg-white/[0.05] text-muted hover:border-white/20 hover:bg-white/[0.08] hover:text-foreground'
  );
}

function trackFilter(label: string, value: string | boolean) {
  trackEvent('filter_applied', {
    filter: label,
    value: String(value)
  });
}

function getActiveFilterChips(pathname: string, state: BrowseState, keepQueryOnReset: boolean) {
  const chips: { label: string; href: string }[] = [];

  if (!keepQueryOnReset && state.q) {
    chips.push({
      label: `Search: ${state.q}`,
      href: getBrowseHref(pathname, state, { q: undefined })
    });
  }

  if (state.sort !== 'featured') {
    chips.push({
      label: browseSortOptions.find((option) => option.value === state.sort)?.label ?? 'Sort',
      href: getBrowseHref(pathname, state, { sort: 'featured' })
    });
  }

  if (state.category) {
    chips.push({
      label: state.category,
      href: getBrowseHref(pathname, state, { category: undefined })
    });
  }

  if (state.tag) {
    chips.push({
      label: `Tag: ${state.tag}`,
      href: getBrowseHref(pathname, state, { tag: undefined })
    });
  }

  booleanFilters.forEach((filter) => {
    if (state[filter.key]) {
      chips.push({
        label: filter.label,
        href: getBrowseHref(pathname, state, { [filter.key]: false })
      });
    }
  });

  return chips;
}

export function BrowseControls({
  pathname,
  state,
  tags: tagOptions,
  showCategoryFilter = true,
  showTagFilter = true,
  keepQueryOnReset = false,
  tagLimit = 12
}: BrowseControlsProps) {
  const tags = (tagOptions ?? getAllTags()).slice(0, tagLimit);
  const activeChips = getActiveFilterChips(pathname, state, keepQueryOnReset);
  const hasFilters = hasActiveBrowseFilters(state, !keepQueryOnReset);

  return (
    <section className="space-y-5 rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-card sm:p-5">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Refine discovery
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Start curated, then narrow by genre, device, tags, and editorial signals.
            </p>
          </div>
          {hasFilters ? (
            <Link
              className="text-sm font-bold text-brand transition hover:text-brand-strong"
              href={getBrowseHref(pathname, getResetBrowseState(state, keepQueryOnReset))}
            >
              Reset filters
            </Link>
          ) : null}
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-muted">Sort by</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {browseSortOptions.map((option) => (
            <Link
              className={filterClassName(state.sort === option.value)}
              href={getBrowseHref(pathname, state, { sort: option.value })}
              key={option.value}
              onClick={() => trackFilter('sort', option.value)}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {showCategoryFilter ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Category</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                className={filterClassName(state.category === category.name)}
                href={getBrowseHref(pathname, state, {
                  category: state.category === category.name ? undefined : category.name
                })}
                key={category.slug}
                onClick={() => trackFilter('category', category.name)}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Filters</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {booleanFilters.map((filter) => (
            <Link
              className={filterClassName(Boolean(state[filter.key]))}
              href={getBrowseHref(pathname, state, { [filter.key]: !state[filter.key] })}
              key={filter.key}
              onClick={() => trackFilter(filter.key, !state[filter.key])}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      {showTagFilter ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Popular tags</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                className={filterClassName(state.tag === tag)}
                href={getBrowseHref(pathname, state, {
                  tag: state.tag === tag ? undefined : tag
                })}
                key={tag}
                onClick={() => trackFilter('tag', tag)}
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {activeChips.length > 0 ? (
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Active</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <Link
                className="rounded-full border border-brand/25 bg-brand/[0.12] px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-brand/[0.18]"
                href={chip.href}
                key={chip.label}
              >
                {chip.label} x
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
