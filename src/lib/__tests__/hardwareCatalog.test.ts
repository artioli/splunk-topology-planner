import { describe, expect, it } from 'vitest';
import { resolveHardwareSpec } from '../hardwareCatalog';

describe('hardwareCatalog', () => {
  it('ES raises indexer to 16c/32GB/32vCPU', () => {
    const spec = resolveHardwareSpec('indexer', { enterpriseSecurity: true, itsi: false });
    expect(spec.physicalCores).toBeGreaterThanOrEqual(16);
    expect(spec.ramGb).toBeGreaterThanOrEqual(32);
    expect(spec.vcpu).toBeGreaterThanOrEqual(32);
    expect(spec.sources).toContain('ES');
  });

  it('ITSI SH has 16 core floor with recommendations', () => {
    const spec = resolveHardwareSpec('search-head-itsi', { enterpriseSecurity: false, itsi: true });
    expect(spec.physicalCores).toBe(16);
    expect(spec.physicalCoresRecommended).toBe(24);
    expect(spec.sources).toContain('ITSI');
  });

  it('both apps use max overlay on indexer', () => {
    const spec = resolveHardwareSpec('indexer', { enterpriseSecurity: true, itsi: true });
    expect(spec.physicalCores).toBeGreaterThanOrEqual(16);
    expect(spec.ramGb).toBeGreaterThanOrEqual(32);
    expect(spec.sources).toContain('ES');
    expect(spec.sources).toContain('ITSI');
  });

  it('explicit indexer tier overrides auto ingest selection', () => {
    const autoMid = resolveHardwareSpec('indexer', {
      enterpriseSecurity: false,
      itsi: false,
      highIngest: true,
    });
    expect(autoMid.physicalCores).toBe(24);

    const forcedMin = resolveHardwareSpec('indexer', {
      enterpriseSecurity: false,
      itsi: false,
      highIngest: true,
      indexerTier: 'min',
    });
    expect(forcedMin.physicalCores).toBe(12);
    expect(forcedMin.tierLabel).toContain('minimum');
  });
});
