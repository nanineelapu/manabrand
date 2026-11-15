/** Brand glyphs (lucide no longer ships these). 24×24, currentColor. */
type P = React.SVGProps<SVGSVGElement>;
const base = { width: 24, height: 24, viewBox: "0 0 24 24", "aria-hidden": true } as const;

export const InstagramIcon = (p: P) => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
  </svg>
);
export const YoutubeIcon = (p: P) => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1c.3-1.3.4-2.5.4-3.8s-.1-2.5-.4-3.8Z" /><path d="m10 15 5-3-5-3z" fill="currentColor" />
  </svg>
);
export const GoogleIcon = (p: P) => (
  <svg {...base} {...p}>
    <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.600-4.100H3.100v2.600A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.400 13.900a6 6 0 0 1 0-3.800V7.500H3.100a10 10 0 0 0 0 9l3.300-2.600Z" />
    <path fill="#EA4335" d="M12 6c1.500 0 2.800.5 3.800 1.500l2.800-2.800A10 10 0 0 0 3.100 7.500l3.300 2.600C7.200 7.800 9.400 6 12 6Z" />
  </svg>
);
export const WhatsAppIcon = (p: P) => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 21l1.7-5A8.500 8.500 0 1 1 8 19.300L3 21Z" /><path d="M9 9.500c0 3 2.500 5.500 5.500 5.500l1-1.200-1.800-.9-.8.600a4 4 0 0 1-1.900-1.900l.6-.8-.9-1.800L9 9.500Z" fill="currentColor" stroke="none" />
  </svg>
);
