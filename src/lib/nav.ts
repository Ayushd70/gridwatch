export const pageLinks = [
  { href: "/", label: "Live timing" },
  { href: "/standings", label: "Standings" },
  { href: "/results", label: "Results" },
  { href: "/calendar", label: "Calendar" },
  { href: "/predict", label: "Predict", hidden: true },
] as const;

export function visiblePageLinks() {
  return pageLinks.filter((link) => !("hidden" in link && link.hidden));
}
