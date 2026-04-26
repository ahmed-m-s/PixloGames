import { describe, expect, it } from 'vitest';
import {
  getGameEmbedSecurityIssues,
  getGameEmbedTrustLevel,
  getGameIframePolicy,
  getGameMessageTargetOrigin
} from '@/lib/embed-security';
import { getGamePublishingReadiness } from '@/lib/publishing';
import { validateGameForServer } from '@/lib/server-validation';
import { makeGame } from './fixtures';

describe('game embed trust boundary', () => {
  it('keeps trusted first-party local packages playable with an explicit same-origin sandbox', () => {
    const game = makeGame({
      slug: 'endless-runner',
      sourceOrigin: 'first_party',
      embedType: 'html5-package',
      embedUrl: '/games/endless-runner/index.html',
      source: {
        mode: 'embedded',
        embedType: 'html5-package',
        url: '/games/endless-runner/index.html',
        message: 'Playable HTML5 embed'
      }
    });

    const policy = getGameIframePolicy(game);

    expect(getGameEmbedTrustLevel(game)).toBe('trusted-first-party-local');
    expect(policy.sandbox.split(' ')).toContain('allow-scripts');
    expect(policy.sandbox.split(' ')).toContain('allow-same-origin');
    expect(policy.sandbox.split(' ')).not.toContain('allow-forms');
    expect(policy.allow).toContain('fullscreen');
    expect(getGameMessageTargetOrigin(game, 'https://pixlogames.test')).toBe(
      'https://pixlogames.test'
    );
    expect(getGameEmbedSecurityIssues(game)).toEqual([]);
  });

  it('trusts first-party local packages under the non-route playable asset path', () => {
    const game = makeGame({
      slug: 'panda-mart',
      sourceOrigin: 'first_party',
      embedType: 'html5-package',
      embedUrl: '/playable-games/panda-mart/index.html',
      source: {
        mode: 'embedded',
        embedType: 'html5-package',
        url: '/playable-games/panda-mart/index.html',
        message: 'Playable HTML5 embed'
      }
    });

    expect(getGameEmbedTrustLevel(game)).toBe('trusted-first-party-local');
    expect(getGameEmbedSecurityIssues(game)).toEqual([]);
  });

  it('does not grant same-origin privileges to developer-submitted embeds', () => {
    const game = makeGame({
      sourceOrigin: 'developer_submission',
      embedType: 'iframe',
      embedUrl: 'https://games.example.com/submitted-game/index.html',
      source: {
        mode: 'embedded',
        embedType: 'iframe',
        providerName: 'Developer submission',
        url: 'https://games.example.com/submitted-game/index.html',
        message: 'Playable source supplied through developer intake.'
      }
    });

    const policy = getGameIframePolicy(game);

    expect(getGameEmbedTrustLevel(game)).toBe('sandboxed-third-party');
    expect(policy.sandbox.split(' ')).toContain('allow-scripts');
    expect(policy.sandbox.split(' ')).not.toContain('allow-same-origin');
    expect(policy.sandbox.split(' ')).not.toContain('allow-forms');
    expect(getGameMessageTargetOrigin(game, 'https://pixlogames.test')).toBeUndefined();
    expect(getGameEmbedSecurityIssues(game)).toEqual([]);
  });

  it('fails closed for same-origin developer package embeds', () => {
    const game = makeGame({
      sourceOrigin: 'developer_submission',
      embedType: 'html5-package',
      embedUrl: '/games/submitted-game/index.html',
      source: {
        mode: 'embedded',
        embedType: 'html5-package',
        providerName: 'Developer submission',
        url: '/games/submitted-game/index.html',
        message: 'Playable source supplied through developer intake.'
      }
    });

    const policy = getGameIframePolicy(game);

    expect(getGameEmbedTrustLevel(game)).toBe('invalid');
    expect(policy.sandbox.split(' ')).not.toContain('allow-same-origin');
    expect(getGameEmbedSecurityIssues(game).map((issue) => issue.message)).toContain(
      'Same-origin game embeds are reserved for trusted first-party local packages. Developer or publisher content must use a separate HTTPS game origin.'
    );
    expect(validateGameForServer(game)).toContain(
      'Same-origin game embeds are reserved for trusted first-party local packages. Developer or publisher content must use a separate HTTPS game origin.'
    );
    expect(getGamePublishingReadiness(game).eligible).toBe(false);
  });

  it('rejects non-HTTPS embedded sources unless they are trusted first-party packages', () => {
    const game = makeGame({
      sourceOrigin: 'publisher_feed',
      embedType: 'iframe',
      embedUrl: 'http://games.example.com/unsafe',
      source: {
        mode: 'embedded',
        embedType: 'iframe',
        providerName: 'Publisher feed',
        url: 'http://games.example.com/unsafe',
        message: 'Publisher supplied embed.'
      }
    });

    expect(getGameEmbedTrustLevel(game)).toBe('invalid');
    expect(validateGameForServer(game)).toContain(
      'Embedded games must use HTTPS remote URLs unless they are trusted first-party packages.'
    );
  });
});
