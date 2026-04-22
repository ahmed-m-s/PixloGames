import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { categories } from '@/data/games';
import { cn } from '@/lib/utils';

const accentStyles = {
  brand: 'from-brand/[0.18] to-brand/[0.04] text-brand',
  ember: 'from-ember/[0.18] to-ember/[0.04] text-ember',
  sun: 'from-sun/[0.18] to-sun/[0.04] text-sun',
  aqua: 'from-aqua/[0.18] to-aqua/[0.04] text-aqua'
};

export function CategorySpotlight() {
  return (
    <section>
      <SectionHeader
        description="Clear category routes help players jump straight into the mood they came for."
        eyebrow="Explore"
        title="Category Spotlight"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            className={cn(
              'group rounded-lg border border-white/10 bg-gradient-to-br p-5 transition duration-200 hover:-translate-y-1 hover:border-white/20',
              accentStyles[category.accent]
            )}
            href={`/categories/${category.slug}`}
            key={category.slug}
          >
            <div className="flex h-full min-h-[150px] flex-col justify-between">
              <div>
                <p className="font-display text-2xl font-bold text-foreground">{category.name}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{category.description}</p>
              </div>
              <p className="mt-6 text-sm font-bold transition group-hover:translate-x-1">
                Browse {category.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
