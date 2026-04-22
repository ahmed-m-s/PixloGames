import type { Metadata } from 'next';
import { SubmitGameForm } from '@/components/developers/submit-game-form';
import { LinkButton } from '@/components/ui/button';
import { PageContainer } from '@/components/ui/page-container';
import { Pill } from '@/components/ui/pill';
import { createPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = createPageMetadata(
  'Submit a Game',
  'Developer submission guidelines, review criteria, accepted game formats, and partner onboarding for PixloGames.',
  {
    path: '/developers/submit-game'
  }
);

const acceptedFormats = [
  'Responsive HTML5 builds',
  'Iframe-ready hosted games',
  'WebGL games with mobile fallback',
  'Zip packages prepared for review'
];

const developerFit = [
  'Independent HTML5 game creators with original work',
  'Studios and publishers with browser-ready catalogs',
  'Developers who can provide playable review links or packaged builds',
  'Teams with rights to distribute the submitted game'
];

const platformReasons = [
  'A focused browser-games audience built around instant play',
  'Structured review for performance, metadata, assets, and content safety',
  'Durable submission tracking for approval, needs-changes, and publishing workflow',
  'Editorial collections, category browsing, and future sponsor-safe placement paths'
];

const reviewCriteria = [
  'Fast first load and stable gameplay',
  'Clear controls on desktop and mobile',
  'Ad-safe content and accurate ratings',
  'Original ownership or publish rights',
  'No deceptive downloads or forced redirects'
];

const requirements = [
  'Playable in modern Chromium, Safari, and Firefox browsers',
  'No required account creation before first play',
  'HTTPS-hosted assets and embeds',
  'Safe iframe behavior with no top-level navigation hijacking',
  'Thumbnail and cover art at production quality'
];

const assetChecklist = [
  'Game title, short description, full description, category, and tags',
  'Developer or publisher name plus a contact email for review follow-up',
  'Thumbnail and cover image uploads, or production-quality asset URLs',
  'Playable embed, hosted build, or package reference for internal testing',
  'Desktop and mobile controls, platform support, and reviewer notes'
];

const faqs = [
  {
    question: 'Is this form connected to live submissions?',
    answer:
      'Yes. The form validates metadata, stores thumbnail and cover uploads in local development storage, and persists intake records plus media metadata in PostgreSQL.'
  },
  {
    question: 'Can PixloGames host my game files?',
    answer:
      'The content model supports both external embeds and future hosted packages. Hosted package ingestion will be added once the review tooling is in place.'
  },
  {
    question: 'How are games approved?',
    answer:
      'Games are reviewed for performance, originality, ad safety, mobile support, and quality of the first play session.'
  },
  {
    question: 'What happens if a game needs changes?',
    answer:
      'The submission can be marked needs changes with reviewer notes so the developer can address missing assets, metadata, compatibility, or source issues before approval.'
  }
];

const lifecycle = [
  {
    status: 'submit',
    label: 'Submit Game',
    description: 'Send game metadata, artwork, links, platform support, and reviewer notes.'
  },
  {
    status: 'in_review',
    label: 'Internal Review',
    description: 'Pixlo checks performance, controls, rights, metadata, and ad safety.'
  },
  {
    status: 'needs_changes',
    label: 'Decision',
    description: 'The game is approved, rejected, or returned with clear needs-changes feedback.'
  },
  {
    status: 'draft',
    label: 'Draft Creation',
    description: 'Approved submissions can become internal game drafts for publishing preparation.'
  },
  {
    status: 'publish-readiness',
    label: 'Publish Readiness',
    description:
      'Assets, mobile support, metadata, QA, and content safety are checked before launch.'
  },
  {
    status: 'live',
    label: 'Live on PixloGames',
    description:
      'Published games can appear in browse, search, categories, and editorial collections.'
  }
];

export default function SubmitGamePage() {
  return (
    <main>
      <PageContainer className="space-y-10 py-10 sm:py-12 lg:py-14">
        <section className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.68fr)_minmax(300px,0.32fr)] lg:items-end">
            <div>
              <Pill tone="brand">For developers</Pill>
              <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
                Submit Game to PixloGames.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                PixloGames accepts high-quality HTML5 browser games from developers, studios, and
                publishers who can provide playable builds, clear rights, strong metadata, and
                production-ready artwork.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <LinkButton href="#submission-form" size="lg">
                  Submit Game
                </LinkButton>
                <LinkButton href="#submission-guidelines" size="lg" variant="secondary">
                  Review requirements
                </LinkButton>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/[0.24] p-5">
              <p className="font-display text-xl font-bold text-foreground">What to expect</p>
              <p className="mt-3 text-sm leading-6 text-muted">
                Your submission enters a durable review queue. PixloGames can approve, request
                changes, reject, create an internal draft, and check publish readiness before a game
                becomes live.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <InfoPanel title="Who Can Submit" items={developerFit} />
          <InfoPanel title="Why Submit to PixloGames" items={platformReasons} />
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <InfoPanel title="Accepted Formats" items={acceptedFormats} />
          <InfoPanel title="Review Criteria" items={reviewCriteria} />
          <InfoPanel title="Game Requirements" items={requirements} />
        </section>

        <section
          className="rounded-lg border border-white/10 bg-white/[0.04] p-6 sm:p-8"
          id="review-process"
        >
          <Pill tone="brand">Review lifecycle</Pill>
          <h2 className="mt-4 font-display text-3xl font-bold text-foreground">
            From submission to publication.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            The workflow is designed to be clear for developers and safe for PixloGames operators.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lifecycle.map((step) => (
              <article
                className="rounded-lg border border-white/10 bg-black/[0.18] p-5"
                key={step.status}
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
                  {step.label}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-8"
          id="submission-guidelines"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
            <div>
              <Pill tone="sun">Submission guidelines</Pill>
              <h2 className="mt-4 font-display text-3xl font-bold text-foreground">
                Prepare a complete review package.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Complete submissions move faster. Include the information reviewers need to test the
                game, validate rights, assess mobile support, and prepare publishing assets.
              </p>
            </div>
            <InfoPanel title="Assets and Details Needed" items={assetChecklist} />
          </div>
        </section>

        <section
          className="grid gap-6 rounded-lg border border-white/10 bg-white/[0.05] p-6 sm:p-8 lg:grid-cols-[minmax(0,0.56fr)_minmax(320px,0.44fr)]"
          id="submission-form"
        >
          <div>
            <Pill tone="aqua">Submission intake</Pill>
            <h2 className="mt-4 font-display text-3xl font-bold text-foreground">Submit Game</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Send a complete review package with metadata, source references, platform support,
              uploaded artwork or asset links, and reviewer notes. Internal reviewers will use this
              information to move the submission through review, decision, draft creation, and
              publish readiness.
            </p>
          </div>
          <SubmitGameForm />
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <Pill tone="sun">FAQ</Pill>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {faqs.map((faq) => (
              <article
                className="rounded-lg border border-white/10 bg-black/[0.18] p-5"
                key={faq.question}
              >
                <h3 className="font-display text-lg font-bold text-foreground">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </PageContainer>
    </main>
  );
}

type InfoPanelProps = {
  title: string;
  items: string[];
};

function InfoPanel({ title, items }: InfoPanelProps) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
      <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
        {items.map((item) => (
          <li className="flex gap-3" key={item}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
