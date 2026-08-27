export function scorePodiumSlots(
  pick: { p1: string; p2: string; p3: string },
  podium: [string, string, string],
) {
  const set = new Set(podium);
  const awarded = (got: string, expected: string, exact: number) => {
    if (got === expected) return exact;
    if (set.has(got)) return 1;
    return 0;
  };
  return (
    awarded(pick.p1, podium[0], 5) +
    awarded(pick.p2, podium[1], 3) +
    awarded(pick.p3, podium[2], 1)
  );
}
