import { SIZING } from './constants';
import { gbToTb, roundTb } from './format';
import { buildRetentionBreakdown } from './retentionUtils';
import type { ArchivingMode, PlannerInputs, StorageTierResult } from './types';

export function getDailyMultiplier(
  isClustered: boolean,
  rf: number,
  sf: number,
  cRaw = SIZING.C_RAW,
  cMeta = SIZING.C_META,
): number {
  if (!isClustered) return cRaw + cMeta;
  return cRaw * rf + cMeta * sf;
}

export function getArchiveMultiplier(
  archivingMode: ArchivingMode,
  isClustered: boolean,
  rf: number,
): number {
  if (archivingMode === 'none') return 0;
  if (archivingMode === 'local' || archivingMode === 'clustered-optimized') return 1;
  if (archivingMode === 'clustered-unoptimized' && isClustered) return rf;
  return 1;
}

export function calculateStorage(
  inputs: PlannerInputs,
  indexerCount: number,
  isClustered: boolean,
): StorageTierResult {
  const retention = buildRetentionBreakdown(inputs.hotWarm, inputs.cold, inputs.frozen);
  const rf = inputs.replicationFactor;
  const sf = inputs.searchFactor;
  const dailyMultiplier = getDailyMultiplier(isClustered, rf, sf);
  const dailyGb = inputs.dailyIngestGb * dailyMultiplier;

  const hotWarmGb = dailyGb * retention.hotWarmDays;
  const coldGb = dailyGb * retention.coldDays;
  const searchableGb = hotWarmGb + coldGb;

  const archiveMult = getArchiveMultiplier(inputs.archivingMode, isClustered, rf);
  const frozenGb =
    inputs.archivingMode === 'none'
      ? 0
      : inputs.dailyIngestGb * SIZING.C_RAW * retention.frozenDays * archiveMult;

  const totalGb = searchableGb + frozenGb;
  const peers = Math.max(indexerCount, 1);

  return {
    hotWarmTb: roundTb(gbToTb(hotWarmGb)),
    coldTb: roundTb(gbToTb(coldGb)),
    searchableTb: roundTb(gbToTb(searchableGb)),
    frozenTb: roundTb(gbToTb(frozenGb)),
    totalTb: roundTb(gbToTb(totalGb)),
    perIndexerHotWarmTb: roundTb(gbToTb(hotWarmGb / peers)),
    perIndexerColdTb: roundTb(gbToTb(coldGb / peers)),
    perIndexerFrozenTb: roundTb(gbToTb(frozenGb / peers)),
    perIndexerTotalTb: roundTb(gbToTb(totalGb / peers)),
    dailyMultiplier,
    hotWarmDays: retention.hotWarmDays,
    coldDays: retention.coldDays,
    frozenDays: retention.frozenDays,
    totalRetentionDays: retention.totalDays,
  };
}
