import type { GameSubmission } from '@/types/submission';

export const gameSubmissions: GameSubmission[] = [
  {
    id: 'sub-astro-miners',
    title: 'Astro Miners',
    shortDescription:
      'Mine unstable asteroid seams, dodge orbit hazards, and bank your haul before extraction.',
    description:
      'Astro Miners is a quick-session arcade game built around risky asteroid mining runs, clean movement, upgrade choices, and mobile-friendly extraction timing.',
    tags: ['arcade', 'space', 'mining', 'score chase'],
    developerName: 'Lunar Pantry',
    publisherName: 'Lunar Pantry',
    contactEmail: 'hello@lunarpantry.example',
    category: 'Arcade',
    submittedAt: '2026-04-10',
    updatedAt: '2026-04-16',
    status: 'approved',
    proposedEmbedType: 'iframe',
    buildUrl: 'https://builds.pixlo-intake.local/astro-miners',
    sourceType: 'iframe',
    sourceUrl: 'https://builds.pixlo-intake.local/astro-miners',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80',
    coverImageUrl:
      'https://images.unsplash.com/photo-1462332420958-a05d1e002413?auto=format&fit=crop&w=1500&q=80',
    websiteUrl: 'https://lunarpantry.example/astro-miners',
    submitterNotes: 'Ready for PixloGames draft creation after final operator check.',
    termsAccepted: true,
    supportedPlatforms: ['desktop', 'mobile', 'tablet'],
    reviewOwner: 'Mira',
    reviewNotes: [
      'Strong first session.',
      'Needs final thumbnail pass before approval.',
      'Mobile controls passed smoke test.'
    ],
    criteria: {
      performance: true,
      controls: true,
      adSafety: true,
      rights: true,
      mobile: true
    },
    publishingStatus: 'not_started',
    publishingNotes: []
  },
  {
    id: 'sub-drift-cafe',
    title: 'Drift Cafe',
    developerName: 'Cornerline Games',
    contactEmail: 'partners@cornerline.example',
    category: 'Racing',
    submittedAt: '2026-04-12',
    updatedAt: '2026-04-14',
    status: 'needs_changes',
    proposedEmbedType: 'html5-package',
    buildUrl: 'https://builds.pixlo-intake.local/drift-cafe',
    supportedPlatforms: ['desktop'],
    reviewOwner: 'Rami',
    reviewNotes: [
      'Desktop build is playable.',
      'Mobile support promised but not present.',
      'Package manifest missing orientation metadata.'
    ],
    criteria: {
      performance: true,
      controls: true,
      adSafety: true,
      rights: true,
      mobile: false
    }
  },
  {
    id: 'sub-moon-courts',
    title: 'Moon Courts',
    developerName: 'Pocket Stadium',
    contactEmail: 'submit@pocketstadium.example',
    category: 'Sports',
    submittedAt: '2026-04-15',
    updatedAt: '2026-04-15',
    status: 'pending',
    proposedEmbedType: 'external-provider',
    buildUrl: 'https://provider.example/moon-courts',
    supportedPlatforms: ['desktop', 'gamepad'],
    reviewOwner: 'Unassigned',
    reviewNotes: ['Awaiting first technical review.'],
    criteria: {
      performance: false,
      controls: false,
      adSafety: false,
      rights: true,
      mobile: false
    }
  }
];
