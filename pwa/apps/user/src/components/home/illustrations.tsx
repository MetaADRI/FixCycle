import type { ReactNode } from 'react';

interface IllustrationProps {
  className?: string;
}

/**
 * Wide banner placeholder (1000x500) shown in the BANNERS / BOTTOM_BANNERS
 * carousel when the API has not returned a real banner image yet.
 */
export function HomeBannerIllustration({ className = '' }: IllustrationProps): ReactNode {
  return (
    <svg viewBox="0 0 1000 500" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bannerBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--fc-bg-secondary, #0d3b66)" />
          <stop offset="1" stopColor="var(--fc-bg-primary, #1b6ca8)" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="1000" height="500" rx="24" fill="url(#bannerBg)" />
      {/* Decorative circles */}
      <circle cx="880" cy="80" r="160" fill="white" opacity="0.06" />
      <circle cx="860" cy="460" r="120" fill="white" opacity="0.05" />
      <circle cx="120" cy="460" r="90" fill="white" opacity="0.05" />

      {/* Text column */}
      <g>
        <rect x="64" y="120" width="300" height="28" rx="14" fill="white" opacity="0.25" />
        <rect x="64" y="172" width="420" height="64" rx="12" fill="var(--fc-bg-primary, #f0f4f8)" opacity="0.16" />
        <rect x="64" y="256" width="340" height="26" rx="13" fill="white" opacity="0.9" />
        <rect x="64" y="304" width="300" height="16" rx="8" fill="white" opacity="0.55" />
        <rect x="64" y="332" width="360" height="16" rx="8" fill="white" opacity="0.4" />
        <rect x="64" y="384" width="220" height="52" rx="26" fill="var(--fc-accent, #f76f01)" />
        <rect x="92" y="404" width="120" height="12" rx="6" fill="var(--fc-bg-secondary, #0d3b66)" opacity="0.6" />
      </g>

      {/* Tool illustration cluster (right side) */}
      <g>
        {/* Wrench */}
        <g transform="translate(660,150) rotate(25)">
          <rect x="0" y="0" width="34" height="150" rx="17" fill="var(--fc-bg-primary, #f0f4f8)" opacity="0.22" />
          <circle cx="17" cy="10" r="34" stroke="var(--fc-bg-primary, #f0f4f8)" strokeWidth="14" fill="none" opacity="0.22" />
        </g>
        {/* Phone */}
        <rect x="700" y="180" width="150" height="260" rx="26" stroke="var(--fc-bg-primary, #f0f4f8)" strokeWidth="12" fill="none" opacity="0.25" />
        <rect x="726" y="240" width="52" height="10" rx="5" fill="white" opacity="0.3" />
        <rect x="726" y="264" width="98" height="90" rx="12" fill="white" opacity="0.18" />
        <rect x="740" y="286" width="40" height="12" rx="6" fill="var(--fc-accent, #f76f01)" opacity="0.8" />
        <rect x="740" y="308" width="58" height="12" rx="6" fill="var(--fc-bg-primary, #f0f4f8)" opacity="0.4" />
      </g>

      {/* Cartoon bolt / location pin accents */}
      <g fill="var(--fc-accent, #f76f01)">
        <path d="M470 150l12-14 8 14-12 14z" opacity="0.85" />
        <circle cx="916" cy="250" r="10" opacity="0.7" />
        <circle cx="80" cy="470" r="8" opacity="0.6" />
      </g>
    </svg>
  );
}

/**
 * Empty-home / no-service-area illustration used when the main screen returns
 * no cells or the user has no selected location yet.
 */
export function EmptyHomeIllustration({ className = '' }: IllustrationProps): ReactNode {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="90" fill="var(--fc-bg-primary, #e8edf4)" opacity="0.5" />
      <circle cx="100" cy="100" r="72" fill="var(--fc-bg-primary, #dde4ef)" opacity="0.4" />
      {/* Map pin */}
      <path
        d="M100 42c-20 0-36 15-36 34 0 26 36 56 36 56s36-30 36-56c0-19-16-34-36-34z"
        fill="white"
        stroke="var(--fc-bg-secondary, #0d3b66)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="77" r="12" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="2.5" fill="var(--fc-bg-primary, #e8edf4)" />
      {/* Pin inner hole */}
      <circle cx="100" cy="77" r="4" fill="var(--fc-bg-secondary, #0d3b66)" opacity="0.3" />
      {/* Dashed search routes */}
      <path d="M44 120c8 18 26 30 46 30" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" opacity="0.4" />
      <path d="M156 120c-8 18-26 30-46 30" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" opacity="0.4" />
      {/* Sparkles */}
      <circle cx="56" cy="58" r="2.5" fill="var(--fc-accent, #f76f01)" />
      <circle cx="150" cy="56" r="2" fill="var(--fc-accent, #f76f01)" />
      <path d="M52 48l3-3m98 1l3-3" stroke="var(--fc-accent, #f76f01)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
