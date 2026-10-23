/** How old a snapshot is, and whether it is past the age at which readers should be warned. */
export function freshness(retrievedAt: string, now: Date, maxAgeDays: number) {
  const t = Date.parse(retrievedAt);
  if (Number.isNaN(t)) return { ageDays: null as number | null, stale: true, label: "unknown age" };
  const ageDays = Math.max(0, Math.floor((now.getTime() - t) / 86400000));
  return {
    ageDays,
    stale: ageDays > maxAgeDays,
    label: ageDays === 0 ? "today" : ageDays === 1 ? "1 day old" : `${ageDays} days old`,
  };
}
