import type { AnchorHTMLAttributes } from "react";
export default function Link({
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a href={href.startsWith("/") ? "#" + href : href} {...props} />;
}
export function routeSearch() {
  const hash = window.location.hash;
  return hash.includes("?") ? hash.slice(hash.indexOf("?")) : "";
}
