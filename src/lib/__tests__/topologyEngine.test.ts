import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS } from '../constants';
import { computeTopology } from '../topologyEngine';
import { resolveTopologySettings } from '../topologyResolver';

describe('topologyEngine', () => {
  it('C3 without ES', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      singleServerDeployment: false,
      searchHeadCluster: true,
      searchHeadCount: 3,
      enterpriseSecurity: false,
      dailyIngestGb: 1000,
      autoClusterEstimation: true,
    });
    expect(t.svaCode).toBe('C3');
    expect(t.isClustered).toBe(true);
    expect(t.hasShc).toBe(true);
    expect(t.indexerCount).toBeGreaterThanOrEqual(3);
  });

  it('C3 with ES becomes C13', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      dailyIngestGb: 1000,
      enterpriseSecurity: true,
      searchHeadCluster: true,
    });
    expect(t.svaCode).toBe('C13');
    expect(t.hasEsSh).toBe(true);
  });

  it('S11 with ES on single server', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      singleServerDeployment: true,
      enterpriseSecurity: true,
      dailyIngestGb: 5,
    });
    expect(t.svaCode).toBe('S11');
    expect(t.inventory.some((r) => r.role === 'combined')).toBe(true);
    expect(t.inventory.some((r) => r.role === 'search-head-es')).toBe(true);
  });

  it('adds ITSI search tier separate from ES', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      enterpriseSecurity: true,
      itsi: true,
      searchHeadCluster: true,
    });
    expect(t.hasEsSh).toBe(true);
    expect(t.hasItsiSh).toBe(true);
    expect(t.advisories.some((a) => a.key === 'advisory.esItsiSeparate')).toBe(true);
  });

  it('manual indexer count when auto off', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      autoClusterEstimation: false,
      manualIndexerCount: 7,
      dailyIngestGb: 100,
    });
    expect(t.indexerCount).toBe(7);
  });

  it('SHC enforces minimum 3 search heads', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      searchHeadCluster: true,
      searchHeadCount: 2,
    });
    expect(t.operationalSearchHeadCount).toBe(3);
  });

  it('auto 2-indexer deployment clusters with RF2/SF2', () => {
    const settings = resolveTopologySettings({
      ...DEFAULT_INPUTS,
      singleServerDeployment: false,
      autoClusterEstimation: true,
      enterpriseSecurity: false,
      itsi: false,
      dailyIngestGb: 400, // ceil(400/300) = 2 indexers
    });
    expect(settings.indexerCount).toBe(2);
    expect(settings.isClustered).toBe(true);
    expect(settings.prefix).toBe('C');
    expect(settings.replicationFactor).toBe(2);
    expect(settings.searchFactor).toBe(2);
  });

  it('auto 3+ indexer deployment uses RF3/SF2', () => {
    const settings = resolveTopologySettings({
      ...DEFAULT_INPUTS,
      singleServerDeployment: false,
      autoClusterEstimation: true,
      enterpriseSecurity: false,
      itsi: false,
      dailyIngestGb: 1000, // ceil(1000/300) = 4 indexers
    });
    expect(settings.indexerCount).toBeGreaterThanOrEqual(3);
    expect(settings.isClustered).toBe(true);
    expect(settings.replicationFactor).toBe(3);
    expect(settings.searchFactor).toBe(2);
  });

  it('manual mode without Cluster Replication is non-clustered (D)', () => {
    const settings = resolveTopologySettings({
      ...DEFAULT_INPUTS,
      singleServerDeployment: false,
      autoClusterEstimation: false,
      clusterReplication: false,
      manualIndexerCount: 5,
    });
    expect(settings.indexerCount).toBe(5);
    expect(settings.isClustered).toBe(false);
    expect(settings.prefix).toBe('D');
    expect(settings.replicationFactor).toBe(1);
    expect(settings.searchFactor).toBe(1);
  });

  it('manual mode with Cluster Replication clusters and keeps RF/SF', () => {
    const settings = resolveTopologySettings({
      ...DEFAULT_INPUTS,
      singleServerDeployment: false,
      autoClusterEstimation: false,
      clusterReplication: true,
      manualIndexerCount: 5,
      replicationFactor: 3,
      searchFactor: 2,
    });
    expect(settings.isClustered).toBe(true);
    expect(settings.prefix).toBe('C');
    expect(settings.replicationFactor).toBe(3);
    expect(settings.searchFactor).toBe(2);
  });

  it('virtualization overhead scales indexer compute and tags VIRT', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      singleServerDeployment: false,
      autoClusterEstimation: true,
      enterpriseSecurity: false,
      itsi: false,
      dailyIngestGb: 400, // 2 indexers, indexerMin baseline 12c/24vCPU/12GB
      environment: 'virtual',
      virtualizationOverheadPct: 50,
    });
    const indexer = t.inventory.find((r) => r.role === 'indexer');
    expect(indexer).toBeDefined();
    expect(indexer?.hardware.physicalCores).toBe(18);
    expect(indexer?.hardware.vcpu).toBe(36);
    expect(indexer?.hardware.ramGb).toBe(18);
    expect(indexer?.hardware.sources).toContain('VIRT');
  });

  it('does not tag VIRT on physical deployments', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      dailyIngestGb: 400,
      environment: 'physical',
      virtualizationOverheadPct: 50,
    });
    const indexer = t.inventory.find((r) => r.role === 'indexer');
    expect(indexer?.hardware.sources).not.toContain('VIRT');
  });

  it('manual ES SHC drives ES search head count', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      singleServerDeployment: false,
      autoClusterEstimation: false,
      clusterReplication: false,
      manualIndexerCount: 3,
      enterpriseSecurity: true,
      esShc: true,
      esShcMembers: 5,
    });
    const esRow = t.inventory.find((r) => r.role === 'search-head-es');
    expect(esRow?.count).toBe(5);
  });

  it('manual ES without SHC uses a single ES search head', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      singleServerDeployment: false,
      autoClusterEstimation: false,
      clusterReplication: false,
      manualIndexerCount: 3,
      enterpriseSecurity: true,
      esShc: false,
    });
    const esRow = t.inventory.find((r) => r.role === 'search-head-es');
    expect(esRow?.count).toBe(1);
  });

  it('manual ITSI SHC drives ITSI search head count', () => {
    const t = computeTopology({
      ...DEFAULT_INPUTS,
      singleServerDeployment: false,
      autoClusterEstimation: false,
      clusterReplication: false,
      manualIndexerCount: 3,
      itsi: true,
      itsiShc: true,
      itsiShcMembers: 4,
    });
    const itsiRow = t.inventory.find((r) => r.role === 'search-head-itsi');
    expect(itsiRow?.count).toBe(4);
  });
});
