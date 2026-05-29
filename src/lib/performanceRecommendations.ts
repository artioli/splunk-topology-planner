/** Splunk Enterprise 10.4 Daily Indexing Volume table (indexer / combined counts). */
const INGEST_BANDS = [
  { maxGb: 2, label: '< 2 GB/day' },
  { maxGb: 300, label: '2–300 GB/day' },
  { maxGb: 600, label: '300–600 GB/day' },
  { maxGb: 1024, label: '600 GB–1 TB/day' },
  { maxGb: 2048, label: '1–2 TB/day' },
  { maxGb: 3072, label: '2–3 TB/day' },
] as const;

const USER_BANDS = [
  { maxUsers: 4, label: 'Fewer than 4 users' },
  { maxUsers: 8, label: 'Up to 8 users' },
  { maxUsers: 16, label: 'Up to 16 users' },
  { maxUsers: 24, label: 'Up to 24 users' },
  { maxUsers: 48, label: 'Up to 48 users' },
] as const;

type Cell = { indexers: number; searchHeads: number; combined: boolean };

const TABLE: Cell[][] = [
  [
    { indexers: 0, searchHeads: 0, combined: true },
    { indexers: 0, searchHeads: 0, combined: true },
    { indexers: 2, searchHeads: 1, combined: false },
    { indexers: 3, searchHeads: 1, combined: false },
    { indexers: 7, searchHeads: 1, combined: false },
    { indexers: 10, searchHeads: 1, combined: false },
  ],
  [
    { indexers: 0, searchHeads: 0, combined: true },
    { indexers: 1, searchHeads: 1, combined: false },
    { indexers: 2, searchHeads: 1, combined: false },
    { indexers: 3, searchHeads: 1, combined: false },
    { indexers: 8, searchHeads: 1, combined: false },
    { indexers: 12, searchHeads: 2, combined: false },
  ],
  [
    { indexers: 1, searchHeads: 1, combined: false },
    { indexers: 1, searchHeads: 1, combined: false },
    { indexers: 3, searchHeads: 1, combined: false },
    { indexers: 4, searchHeads: 1, combined: false },
    { indexers: 10, searchHeads: 1, combined: false },
    { indexers: 15, searchHeads: 2, combined: false },
  ],
  [
    { indexers: 1, searchHeads: 1, combined: false },
    { indexers: 2, searchHeads: 1, combined: false },
    { indexers: 3, searchHeads: 1, combined: false },
    { indexers: 6, searchHeads: 2, combined: false },
    { indexers: 12, searchHeads: 2, combined: false },
    { indexers: 18, searchHeads: 3, combined: false },
  ],
  [
    { indexers: 2, searchHeads: 1, combined: false },
    { indexers: 2, searchHeads: 1, combined: false },
    { indexers: 4, searchHeads: 1, combined: false },
    { indexers: 7, searchHeads: 2, combined: false },
    { indexers: 14, searchHeads: 2, combined: false },
    { indexers: 21, searchHeads: 3, combined: false },
  ],
];

function ingestBandIndex(ingestGb: number): number {
  for (let i = 0; i < INGEST_BANDS.length; i++) {
    if (ingestGb <= INGEST_BANDS[i].maxGb) return i;
  }
  return INGEST_BANDS.length - 1;
}

function userBandIndex(users: number): number {
  for (let i = 0; i < USER_BANDS.length; i++) {
    if (users <= USER_BANDS[i].maxUsers) return i;
  }
  return USER_BANDS.length - 1;
}

export function getPerformanceRecommendation(ingestGb: number, concurrentUsers: number) {
  const ui = userBandIndex(Math.max(1, concurrentUsers));
  const ii = ingestBandIndex(ingestGb);
  const cell = TABLE[ui][ii];

  let summary: string;
  if (cell.combined) {
    summary = `For ${USER_BANDS[ui].label} and ${INGEST_BANDS[ii].label}, Splunk guidance suggests a single combined instance.`;
  } else {
    summary = `For ${USER_BANDS[ui].label} and ${INGEST_BANDS[ii].label}, Splunk guidance suggests ${cell.indexers} indexer(s) and ${cell.searchHeads} search head(s).`;
  }

  return {
    ingestBandLabel: INGEST_BANDS[ii].label,
    userBandLabel: USER_BANDS[ui].label,
    recommendedIndexers: cell.combined ? 1 : cell.indexers,
    recommendedSearchHeads: cell.combined ? 1 : cell.searchHeads,
    useCombinedInstance: cell.combined,
    summary,
  };
}
