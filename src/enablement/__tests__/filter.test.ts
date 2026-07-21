import { describe, expect, it } from 'vitest';
import { filterCredentials, filterCredentialsForMatrix } from '../catalog';
import credentials from '../data/credentials.json';
import { DEFAULT_FILTERS, type Credential } from '../types';

const creds = credentials as Credential[];

describe('enablement catalog filters', () => {
  it('defaults to accreditations tab', () => {
    const out = filterCredentials(creds, DEFAULT_FILTERS, []);
    expect(out.every((c) => c.kind === 'accreditation')).toBe(true);
    expect(out.length).toBeGreaterThan(10);
  });

  it('filters by track observability', () => {
    const out = filterCredentials(creds, { ...DEFAULT_FILTERS, track: 'observability' }, []);
    expect(out.every((c) => c.track === 'observability')).toBe(true);
  });

  it('filters partner only', () => {
    const out = filterCredentials(creds, { ...DEFAULT_FILTERS, partnerOnly: true }, []);
    expect(out.every((c) => c.partnerOnly)).toBe(true);
  });

  it('matrix filter ignores tab kind', () => {
    const tabbed = filterCredentials(creds, { ...DEFAULT_FILTERS, tab: 'certifications' }, []);
    const matrix = filterCredentialsForMatrix(creds, DEFAULT_FILTERS, []);
    expect(matrix.length).toBeGreaterThan(tabbed.length);
  });

  it('search matches objective text', () => {
    const out = filterCredentials(creds, { ...DEFAULT_FILTERS, search: 'observability cloud' }, []);
    expect(out.length).toBeGreaterThan(0);
  });
});
