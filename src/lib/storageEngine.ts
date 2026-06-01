import { SIZING } from './constants';
import { gbToTb, roundTb } from './format';
import { buildRetentionBreakdown } from './retentionUtils';
import type { PlannerInputs, StorageTierResult } from './types';

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

  // Each indexer archives its own raw frozen data (no clustered archive multiplier).
  const frozenGb =
    retention.frozenDays > 0
      ? inputs.dailyIngestGb * SIZING.C_RAW * retention.frozenDays
      : 0;

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
