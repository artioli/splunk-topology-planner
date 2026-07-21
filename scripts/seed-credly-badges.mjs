#!/usr/bin/env node
/**
 * Maintainer helper: regenerate credly-badges.json skeleton from credentials.json.
 * Replace imageUrl with Credly CDN URLs after manual review from:
 * https://www.credly.com/organizations/splunk/badges
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../src/enablement/data');
const credentials = JSON.parse(readFileSync(join(dataDir, 'credentials.json'), 'utf8'));

const badges = credentials.map((c) => ({
  credentialId: c.id,
  imageUrl: '',
  pageUrl: 'https://www.credly.com/organizations/splunk/badges',
  localImage: 'badges/placeholder.svg',
}));

writeFileSync(join(dataDir, 'credly-badges.json'), `${JSON.stringify(badges, null, 2)}\n`, 'utf8');
console.log(`Wrote credly-badges.json (${badges.length} entries)`);
