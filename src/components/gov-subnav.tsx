import Link from "./link";

const ITEMS = [
  { id: "all", href: "/government", label: "All actions" },
  { id: "president", href: "/government/president", label: "Presidential actions, dated" },
  { id: "congress", href: "/congress", label: "Congress tracker" },
  { id: "compare", href: "/compare", label: "Compare candidates" },
] as const;

/** The four ways into Government. One component so every page under Government offers the same next steps. */
export default function GovSubnav({ current }: { current: (typeof ITEMS)[number]["id"] }) {
  return (
    <nav className="subnav" aria-label="Government views">
      {ITEMS.map((i) => (
        <Link key={i.id} href={i.href} aria-current={i.id === current ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
