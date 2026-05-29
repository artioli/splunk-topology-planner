import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../constants';
import { computeNetworkPorts } from '../networkPlanner';
import { computeTopology } from '../topologyEngine';

describe('networkPlanner', () => {
  it('S1 includes 8089 and 8000', () => {
    const inputs = { ...DEFAULT_INPUTS, resiliency: 'S' as const, searchTier: '1' as const };
    const topo = computeTopology(inputs);
    const { ports } = computeNetworkPorts(topo, inputs);
    expect(ports.some((p) => p.ports === '8089')).toBe(true);
    expect(ports.some((p) => p.ports === '8000')).toBe(true);
  });

  it('C13 includes SHC, KV, and HEC ports', () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      resiliency: 'C' as const,
      searchTier: '3' as const,
      enterpriseSecurity: true,
    };
    const topo = computeTopology(inputs);
    const { ports } = computeNetworkPorts(topo, inputs);
    expect(ports.some((p) => p.ports.includes('8081'))).toBe(true);
    expect(ports.some((p) => p.ports.includes('8065'))).toBe(true);
    expect(ports.some((p) => p.ports === '8088')).toBe(true);
  });
});
