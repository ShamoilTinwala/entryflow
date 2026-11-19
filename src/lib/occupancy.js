export function peopleInside(passes, entries) {
  const passCount = passes.reduce((sum, pass) => sum + Number(pass.insideCount || 0), 0);
  return entries.reduce((sum, entry) => {
    if (entry.reversedAt || entry.passId) return sum;
    if (entry.action === "manual-check-in") return sum + entry.count;
    if (entry.action === "check-out" && entry.sourceEntryId) return sum - entry.count;
    return sum;
  }, passCount);
}
