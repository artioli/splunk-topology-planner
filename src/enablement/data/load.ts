import credentialsJson from './credentials.json';
import coursesJson from './courses.json';
import credlyBadgesJson from './credly-badges.json';
import manifestJson from './manifest.json';
import type { Course, Credential, CredlyBadgeEntry, EnablementManifest } from '../types';

export const manifest = manifestJson as EnablementManifest;
export const courses = coursesJson as Course[];
export const credlyBadges = credlyBadgesJson as CredlyBadgeEntry[];

const badgeMap = new Map(credlyBadges.map((b) => [b.credentialId, b]));

export function getCredentials(): Credential[] {
  return (credentialsJson as Credential[]).map((c) => {
    const badge = badgeMap.get(c.id);
    if (!badge) return c;
    const base = import.meta.env.BASE_URL ?? '/';
    const local = badge.localImage ? `${base}${badge.localImage.replace(/^\//, '')}` : undefined;
    return {
      ...c,
      credlyBadgeImageUrl: badge.imageUrl || local || c.credlyBadgeImageUrl,
      credlyPageUrl: badge.pageUrl || c.credlyPageUrl,
    };
  });
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}
