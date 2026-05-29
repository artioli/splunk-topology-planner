/** GB/day = ((EPS * avgBytes * 3600 * 24) / 1024^3) * utilization */
export function epsToGbPerDay(
  eventsPerSecond: number,
  avgEventBytes: number,
  utilization: number,
): number {
  const raw =
    (eventsPerSecond * avgEventBytes * 3600 * 24) / Math.pow(1024, 3);
  return raw * utilization;
}
