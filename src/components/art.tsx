/** Small hand-drawn-style illustrations. Decorative: hidden from assistive technology. */
type P = { className?: string };
const base = { viewBox: "0 0 96 96", fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: false } as const;

export const BrandMark = ({ className }: P) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path d="M6 40V24a12 12 0 0 1 24 0v16" fill="none" stroke="#2b5a4c" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M18 40V28a12 12 0 0 1 24 0v12" fill="none" stroke="#a8461f" strokeWidth="4.5" strokeLinecap="round" />
    <circle cx="24" cy="12" r="3.2" fill="#d79a2b" />
  </svg>
);

export const BookStack = ({ className }: P) => (
  <svg className={className} {...base}>
    <rect x="14" y="62" width="68" height="14" rx="3" />
    <rect x="20" y="46" width="58" height="14" rx="3" />
    <rect x="12" y="30" width="62" height="14" rx="3" />
    <path d="M30 30V44M58 46V60M36 62V76" />
    <path d="M62 14c4 0 8 2 10 6M70 10c3 0 6 2 8 5" />
  </svg>
);

export const BallotBox = ({ className }: P) => (
  <svg className={className} {...base}>
    <rect x="16" y="40" width="64" height="40" rx="5" />
    <path d="M34 40V32a14 14 0 0 1 28 0v8" opacity="0" />
    <path d="M40 46h16" />
    <path d="M30 18l22-6 4 14-22 6z" transform="rotate(-8 48 24)" />
    <path d="M38 22l12-3M40 27l10-2.5" transform="rotate(-8 48 24)" />
    <path d="M38 62l6 6 12-14" />
  </svg>
);

export const Dome = ({ className }: P) => (
  <svg className={className} {...base}>
    <path d="M18 78h60M24 78V62M72 78V62M34 78V62M62 78V62M48 78V62" />
    <path d="M20 62h56" />
    <path d="M26 62c0-14 10-24 22-24s22 10 22 24" />
    <path d="M48 38V26M44 26h8M48 26V16M48 16l6 3-6 3" />
  </svg>
);

export const Speech = ({ className }: P) => (
  <svg className={className} {...base}>
    <path d="M14 28a8 8 0 0 1 8-8h30a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H34l-12 10V52a8 8 0 0 1-8-8z" />
    <path d="M66 36h8a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8v10L62 68H46a8 8 0 0 1-8-8v-2" />
    <path d="M26 32h24M26 40h14" />
  </svg>
);

export const Sprig = ({ className }: P) => (
  <svg className={className} {...base}>
    <path d="M48 84V30" />
    <path d="M48 62c-14 0-20-8-20-18 12 0 20 6 20 18zM48 48c14 0 20-8 20-18-12 0-20 6-20 18zM48 36c-8-2-12-8-12-16 8 2 12 8 12 16z" />
  </svg>
);

export const Compass = ({ className }: P) => (
  <svg className={className} {...base}>
    <circle cx="48" cy="48" r="32" />
    <path d="M62 34L54 54 34 62l8-20z" />
    <circle cx="48" cy="48" r="3" />
  </svg>
);

export const Scroll = ({ className }: P) => (
  <svg className={className} {...base}>
    <path d="M26 20h44a6 6 0 0 1 6 6v46a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8V30" />
    <path d="M22 30a8 8 0 0 1 8-8M36 38h30M36 48h30M36 58h20" />
  </svg>
);
