'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';

type SubmissionState =
  | {
      status: 'idle';
    }
  | {
      status: 'submitting';
    }
  | {
      status: 'success';
      submissionId: string;
      warnings: string[];
    }
  | {
      status: 'error';
      message: string;
      issues: string[];
    };

const categories = [
  'Action',
  'Racing',
  'Puzzle',
  'Adventure',
  'Multiplayer',
  'Shooting',
  'Sports',
  'Arcade',
  'Management'
];

const platformOptions = [
  { label: 'Desktop', value: 'desktop' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Tablet', value: 'tablet' },
  { label: 'Gamepad', value: 'gamepad' }
];

export function SubmitGameForm() {
  const [state, setState] = useState<SubmissionState>({ status: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setState({ status: 'submitting' });

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        setState({
          status: 'error',
          message: body.error?.message ?? 'Submission could not be sent.',
          issues: body.error?.issues ?? []
        });
        return;
      }

      setState({
        status: 'success',
        submissionId: body.data.id,
        warnings: body.data.intakeWarnings ?? []
      });
      event.currentTarget.reset();
    } catch {
      setState({
        status: 'error',
        message: 'Network error while sending the submission.',
        issues: ['Please try again once the connection is stable.']
      });
    }
  }

  return (
    <form className="space-y-5" encType="multipart/form-data" onSubmit={handleSubmit}>
      {state.status === 'success' ? (
        <div className="rounded-lg border border-brand/25 bg-brand/[0.1] p-4">
          <p className="text-sm font-bold text-brand">Submission received</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your game is now in the PixloGames review queue as{' '}
            <span className="font-bold text-foreground">{state.submissionId}</span>.
          </p>
          {state.warnings.length > 0 ? (
            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
              {state.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="rounded-lg border border-ember/30 bg-ember/[0.1] p-4">
          <p className="text-sm font-bold text-ember">{state.message}</p>
          {state.issues.length > 0 ? (
            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
              {state.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Game title" name="title" placeholder="Neon Driftline" required />
        <FormField label="Developer name" name="developerName" placeholder="Studio name" required />
        <FormField label="Publisher name" name="publisherName" placeholder="Optional publisher" />
        <FormField
          label="Contact email"
          name="contactEmail"
          placeholder="developer@example.com"
          required
          type="email"
        />
      </div>

      <label className="block">
        <span className="text-sm font-bold text-foreground">Short description</span>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/[0.25] px-4 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand/[0.55]"
          name="shortDescription"
          placeholder="A crisp one-line pitch for players and reviewers"
          required
          type="text"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-foreground">Full description</span>
        <textarea
          className="mt-2 min-h-28 w-full rounded-lg border border-white/10 bg-black/[0.25] px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand/[0.55]"
          name="description"
          placeholder="Describe the game loop, controls, audience, session length, and what makes it a strong instant-play fit."
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold text-foreground">Category</span>
          <select
            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/[0.25] px-4 text-sm text-foreground outline-none focus:border-brand/[0.55]"
            name="category"
            required
          >
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <FormField label="Tags" name="tags" placeholder="drift, cars, arcade" required />
      </div>

      <fieldset className="rounded-lg border border-white/10 bg-black/[0.18] p-4">
        <legend className="px-1 text-sm font-bold text-foreground">Supported platforms</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {platformOptions.map((platform) => (
            <label
              className="flex items-center gap-3 text-sm font-semibold text-muted"
              key={platform.value}
            >
              <input
                className="h-4 w-4 accent-brand"
                defaultChecked={platform.value === 'desktop'}
                name="supportedPlatforms"
                type="checkbox"
                value={platform.value}
              />
              {platform.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold text-foreground">Source type</span>
          <select
            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/[0.25] px-4 text-sm text-foreground outline-none focus:border-brand/[0.55]"
            name="sourceType"
            required
          >
            <option value="iframe">Iframe-ready hosted game</option>
            <option value="html5-package">HTML5 package link</option>
            <option value="external-provider">External provider</option>
            <option value="source-reference">Source reference</option>
          </select>
        </label>
        <FormField
          label="Playable URL or package link"
          name="buildUrl"
          placeholder="https://..."
          required
          type="url"
        />
        <FormField label="Embed/source URL" name="sourceUrl" placeholder="https://..." type="url" />
        <FormField
          label="Developer or game website"
          name="websiteUrl"
          placeholder="https://..."
          type="url"
        />
        <FormField
          label="Thumbnail image URL fallback"
          name="thumbnailUrl"
          placeholder="https://..."
          type="url"
        />
        <FormField
          label="Cover image URL fallback"
          name="coverImageUrl"
          placeholder="https://..."
          type="url"
        />
      </div>

      <section className="rounded-lg border border-white/10 bg-black/[0.18] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">Upload artwork</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Local/dev storage accepts JPG, PNG, WebP, or GIF images up to 5 MB each. Uploaded
              artwork takes priority over URL fallbacks.
            </p>
          </div>
          <span className="rounded-full border border-brand/20 bg-brand/[0.1] px-3 py-1 text-xs font-bold text-brand">
            Local dev storage
          </span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <UploadField
            description="Used in browse cards, search, and publishing readiness."
            label="Thumbnail upload"
            name="thumbnailFile"
          />
          <UploadField
            description="Used on game pages, featured surfaces, and internal review."
            label="Cover image upload"
            name="coverFile"
          />
        </div>
      </section>

      <label className="block">
        <span className="text-sm font-bold text-foreground">Notes for reviewers</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/[0.25] px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand/[0.55]"
          name="submitterNotes"
          placeholder="Controls, known limitations, rights confirmation, setup notes, or mobile caveats"
        />
      </label>

      <div className="rounded-lg border border-white/10 bg-black/[0.18] p-4">
        <label className="flex gap-3 text-sm leading-6 text-muted">
          <input
            className="mt-1 h-4 w-4 accent-brand"
            name="termsAccepted"
            required
            type="checkbox"
          />
          <span>
            I confirm that I own or can publish this game, all submitted links are safe, and
            PixloGames may review the game for platform inclusion.
          </span>
        </label>
      </div>

      <Button className="w-full" disabled={state.status === 'submitting'} size="lg" type="submit">
        {state.status === 'submitting' ? 'Sending submission...' : 'Submit for review'}
      </Button>

      <p className="text-xs leading-5 text-muted">
        Image uploads are stored in local development storage and tracked durably in PostgreSQL.
        Game build/package hosting is still source-link based until cloud object storage is
        connected.
      </p>
    </form>
  );
}

type FormFieldProps = {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
};

function FormField({ label, name, placeholder, required, type = 'text' }: FormFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-foreground">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/[0.25] px-4 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand/[0.55]"
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

type UploadFieldProps = {
  label: string;
  name: string;
  description: string;
};

function UploadField({ label, name, description }: UploadFieldProps) {
  return (
    <label className="block rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <span className="text-sm font-bold text-foreground">{label}</span>
      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="mt-3 block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-bold file:text-black hover:file:bg-brand-strong"
        name={name}
        type="file"
      />
      <span className="mt-3 block text-xs leading-5 text-muted">{description}</span>
    </label>
  );
}
