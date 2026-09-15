import type { ReactNode } from 'react';

interface IllustrationProps {
  className?: string;
}

export function BookingIllustration({ className = '' }: IllustrationProps): ReactNode {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="90" fill="var(--fc-bg-primary, #e8edf4)" opacity="0.5" />
      <circle cx="100" cy="100" r="72" fill="var(--fc-bg-primary, #dde4ef)" opacity="0.4" />
      {/* House */}
      <path d="M100 50L55 82v56h90V82L100 50z" fill="white" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="82" y="100" width="36" height="38" rx="2" fill="var(--fc-bg-secondary, #0d3b66)" opacity="0.12" />
      <rect x="88" y="108" width="24" height="30" rx="2" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="2" fill="white" />
      <line x1="100" y1="108" x2="100" y2="138" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="1.5" />
      <line x1="88" y1="123" x2="112" y2="123" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="1.5" />
      <rect x="66" y="90" width="18" height="16" rx="2" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="1.8" fill="white" />
      <line x1="75" y1="90" x2="75" y2="106" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="1.2" />
      <line x1="66" y1="98" x2="84" y2="98" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="1.2" />
      <rect x="116" y="90" width="18" height="16" rx="2" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="1.8" fill="white" />
      <line x1="125" y1="90" x2="125" y2="106" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="1.2" />
      <line x1="116" y1="98" x2="134" y2="98" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="1.2" />
      {/* Wrench */}
      <g transform="translate(135,52) rotate(30)">
        <rect x="0" y="0" width="5" height="28" rx="2.5" fill="var(--fc-bg-secondary, #0d3b66)" />
        <circle cx="2.5" cy="2" r="6" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="2.5" fill="white" />
      </g>
      {/* Sparkle */}
      <circle cx="58" cy="60" r="2.5" fill="var(--fc-accent, #f5a623)" />
      <circle cx="148" cy="72" r="2" fill="var(--fc-accent, #f5a623)" />
      <path d="M52 70l3-3m98 8l3-3" stroke="var(--fc-accent, #f5a623)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function VerifiedIllustration({ className = '' }: IllustrationProps): ReactNode {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="90" fill="var(--fc-bg-primary, #e8edf4)" opacity="0.5" />
      <circle cx="100" cy="100" r="72" fill="var(--fc-bg-primary, #dde4ef)" opacity="0.4" />
      {/* Shield */}
      <path d="M100 42L55 62v38c0 38 19 60 45 70 26-10 45-32 45-70V62L100 42z" fill="white" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M100 55L65 71v30c0 28 15 44 35 52 20-8 35-24 35-52V71L100 55z" fill="var(--fc-bg-secondary, #0d3b66)" opacity="0.06" />
      {/* Checkmark */}
      <path d="M80 102l12 12 28-30" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Person silhouette */}
      <circle cx="100" cy="85" r="10" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="2" fill="white" />
      <path d="M88 118c0-8 5-14 12-14s12 6 12 14" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="2" fill="white" />
      {/* Sparkle */}
      <circle cx="56" cy="66" r="2.5" fill="var(--fc-accent, #f5a623)" />
      <circle cx="150" cy="62" r="2" fill="var(--fc-accent, #f5a623)" />
      <path d="M52 56l3-3m98 4l3-3" stroke="var(--fc-accent, #f5a623)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FastBookingIllustration({ className = '' }: IllustrationProps): ReactNode {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="90" fill="var(--fc-bg-primary, #e8edf4)" opacity="0.5" />
      <circle cx="100" cy="100" r="72" fill="var(--fc-bg-primary, #dde4ef)" opacity="0.4" />
      {/* Phone */}
      <rect x="72" y="46" width="56" height="96" rx="10" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="2.5" fill="white" />
      <rect x="78" y="58" width="44" height="68" rx="2" fill="var(--fc-bg-secondary, #0d3b66)" opacity="0.06" />
      <circle cx="100" cy="140" r="3" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="1.5" fill="none" />
      {/* Content on phone screen */}
      <rect x="84" y="64" width="32" height="6" rx="3" fill="var(--fc-bg-secondary, #0d3b66)" opacity="0.2" />
      <rect x="84" y="74" width="24" height="4" rx="2" fill="var(--fc-bg-secondary, #0d3b66)" opacity="0.12" />
      <rect x="84" y="84" width="32" height="20" rx="4" fill="var(--fc-accent, #f5a623)" opacity="0.25" />
      <rect x="84" y="88" width="16" height="3" rx="1.5" fill="var(--fc-accent, #f5a623)" opacity="0.5" />
      <rect x="84" y="94" width="20" height="3" rx="1.5" fill="var(--fc-accent, #f5a623)" opacity="0.35" />
      <rect x="84" y="110" width="32" height="16" rx="4" fill="var(--fc-bg-secondary, #0d3b66)" opacity="0.12" />
      {/* Clock */}
      <circle cx="145" cy="68" r="16" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="2.2" fill="white" />
      <line x1="145" y1="60" x2="145" y2="68" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="2" strokeLinecap="round" />
      <line x1="145" y1="68" x2="152" y2="72" stroke="var(--fc-bg-secondary, #0d3b66)" strokeWidth="2" strokeLinecap="round" />
      {/* Lightning bolt */}
      <path d="M52 82l6-6 4 6-6 6z" fill="var(--fc-accent, #f5a623)" opacity="0.6" />
      <path d="M50 92l5-5 3 5-5 5z" fill="var(--fc-accent, #f5a623)" opacity="0.4" />
      {/* Sparkle */}
      <circle cx="55" cy="58" r="2" fill="var(--fc-accent, #f5a623)" />
      <circle cx="152" cy="110" r="2.5" fill="var(--fc-accent, #f5a623)" />
    </svg>
  );
}