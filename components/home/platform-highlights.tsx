const highlights = [
  {
    title: 'Instant browser play',
    description: 'Jump into HTML5 games directly from the page, with no launcher or download step.'
  },
  {
    title: 'Built for quick sessions',
    description: 'Short loops, readable controls, and lightweight games tuned for casual play.'
  },
  {
    title: 'Desktop and mobile ready',
    description: 'The catalog favors games that feel natural on keyboard, mouse, and touch screens.'
  }
];

export function PlatformHighlights() {
  return (
    <section aria-label="Why PixloGames" className="grid gap-4 sm:grid-cols-3">
      {highlights.map((highlight) => (
        <div
          className="min-h-32 rounded-lg border border-white/10 bg-white/[0.05] p-5"
          key={highlight.title}
        >
          <p className="font-display text-xl font-bold text-foreground">{highlight.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{highlight.description}</p>
        </div>
      ))}
    </section>
  );
}
