import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'taxi'
  | 'delivery'
  | 'food'
  | 'grocery'
  | 'pharmacy'
  | 'towing'
  | 'salon'
  | 'plumber'
  | 'handyman'
  | 'laundry'
  | 'bus'
  | 'carpool'
  | 'rental'
  | 'outstation'
  | 'pool'
  | 'transfer'
  | 'back'
  | 'menu'
  | 'loc'
  | 'dest'
  | 'wallet'
  | 'card'
  | 'cash'
  | 'sos'
  | 'chat'
  | 'star'
  | 'clock'
  | 'filter'
  | 'search'
  | 'close'
  | 'check'
  | 'chevron'
  | 'phone'
  | 'share'
  | 'promo'
  | 'history'
  | 'user'
  | 'settings'
  | 'logout'
  | 'bell'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'camera'
  | 'document'
  | 'language'
  | 'support'
  | 'info'
  | 'refresh'
  | 'download'
  | 'external'
  | 'wifi-off'
  | 'alert'
  | 'eye'
  | 'eye-off'
  | 'heart'
  | 'chevron-right'
  | 'grid'
  | 'filter-list'
  | 'map'
  | 'navigate'
  | 'arrow-up';

const paths: Record<IconName, ReactNode> = {
  taxi: (
    <>
      <path d="M6.5 11 8 6.5h8l1.5 4.5" />
      <rect x="3" y="11" width="18" height="5" rx="1.5" />
      <path d="M6.5 16v1.5M17.5 16v1.5" />
      <circle cx="7.5" cy="9.5" r=".6" />
      <circle cx="16.5" cy="9.5" r=".6" />
    </>
  ),
  delivery: (
    <>
      <path d="M3 7 12 3l9 4v10l-9 4-9-4Z" />
      <path d="M3 7l9 4 9-4" />
      <path d="M12 11v10" />
    </>
  ),
  food: (
    <>
      <path d="M4.5 11h15a7.5 7.5 0 0 1-15 0Z" />
      <path d="M9 4.8c-.5.9-.5 1.6 0 2.4M15 4.8c-.5.9-.5 1.6 0 2.4" />
      <path d="M12 5.2c.6.9.6 1.6 0 2.4" strokeWidth="1.2" />
    </>
  ),
  grocery: (
    <>
      <path d="M5.5 11h13l-1.1 6.6a2 2 0 0 1-2 1.6H8.6a2 2 0 0 1-2-1.6Z" />
      <path d="m6.5 11 1.8-5.7h7.4L17.5 11" />
      <path d="M12 8.2v4.6M10 10.5h4" />
    </>
  ),
  pharmacy: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8.5v7M8.5 12h7" />
    </>
  ),
  towing: (
    <>
      <path d="M2 9h13l1.5 5H19a3 3 0 0 1 3 3v1h-3" />
      <path d="M13 9 10.5 4h-3" />
      <circle cx="7" cy="17.5" r="2" />
      <circle cx="18.5" cy="17.5" r="2" />
    </>
  ),
  salon: (
    <>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <path d="M8 7.5 20 20" />
      <path d="M8 16.5 20 4" />
    </>
  ),
  plumber: (
    <path d="M14.6 6.4a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6.2 6.2 0 0 1-8.2 8.2l-6.8 6.8a2.12 2.12 0 0 1-3-3l6.8-6.8a6.2 6.2 0 0 1 8.2-8.2Z" />
  ),
  handyman: (
    <>
      <path d="M9.2 6.2V5a2 2 0 0 1 2-2h1.6a2 2 0 0 1 2 2v1.2" />
      <path d="M4.5 6.2h15v4a4.2 4.2 0 0 1-4.2 4.2h-6.6A4.2 4.2 0 0 1 4.5 10.2Z" />
      <path d="M12 9v3" />
    </>
  ),
  laundry: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <circle cx="9" cy="7" r=".9" />
      <circle cx="12" cy="14" r="3.6" />
      <path d="M12 11.6v1M10.6 14h2.8M12 16.4v-1" />
    </>
  ),
  bus: (
    <>
      <rect x="3.5" y="4" width="17" height="12" rx="2" />
      <path d="M3.5 9h17" />
      <path d="M7 16.5V18M17 16.5V18" />
      <path d="M7 11h.01M11 11h.01M15 11h.01" />
    </>
  ),
  carpool: (
    <>
      <path d="M5 9l1.3-3.4A2 2 0 0 1 8.2 4.5h7.6a2 2 0 0 1 1.9 1.1L19 9" />
      <rect x="4" y="9" width="16" height="5" rx="1.5" />
      <path d="M7 14v2M17 14v2" />
      <circle cx="8.2" cy="6.5" r="1.7" />
      <circle cx="15.8" cy="6.5" r="1.7" />
    </>
  ),
  rental: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  outstation: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M3.5 12h17" />
      <path d="M12 4.5c2.7 2.4 2.7 12.6 0 15M12 4.5c-2.7 2.4-2.7 12.6 0 15" />
    </>
  ),
  pool: (
    <>
      <path d="M5 9l1.3-3.4A2 2 0 0 1 8.2 4.5h7.6a2 2 0 0 1 1.9 1.1L19 9" />
      <rect x="4" y="9" width="16" height="5" rx="1.5" />
      <path d="M7 14v2M17 14v2" />
      <path d="M9 12.5c1.5-1 2.5 0 4 0s2.5-1 4 0" strokeWidth="1.2" />
    </>
  ),
  transfer: (
    <>
      <path d="M4 6h12M13 3l3 3-3 3" />
      <path d="M20 18H8M11 15l-3 3 3 3" />
    </>
  ),
  back: <path d="M15 6l-6 6 6 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  loc: (
    <>
      <path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2" />
    </>
  ),
  dest: (
    <>
      <path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10Z" />
      <circle cx="12" cy="11" r="3.4" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v.5" />
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M16 13.5h.01" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10.5h18" />
      <path d="M7 15h4" />
    </>
  ),
  cash: (
    <>
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  sos: (
    <>
      <path d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6Z" />
      <path d="M9.5 12h1.3l.5-2 1.4 4 .5-2h1.3" />
    </>
  ),
  chat: (
    <>
      <path d="M4 6h16v10H9.5L4 20V6Z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  star: <path d="M12 3l2.9 5.9 6.4.9-4.6 4.5 1.1 6.4L12 17.9 6.2 20.7l1.1-6.4L2.7 9.8l6.4-.9Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.8-3.8" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M5 12.5 10 17.5 19 6.5" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  phone: <path d="M6.5 3.5h3l1.4 4-2 1.5a12 12 0 0 0 6.1 6.1l1.5-2 4 1.4v3a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 4.5 5.6a2 2 0 0 1 2-2.1Z" />,
  share: (
    <>
      <circle cx="6.5" cy="12" r="2.2" />
      <circle cx="17.5" cy="6" r="2.2" />
      <circle cx="17.5" cy="18" r="2.2" />
      <path d="M8.6 10.9 15.4 7M8.6 13.1 15.4 17" />
    </>
  ),
  promo: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5Z" />
      <path d="M9 12h.01M12 12h.01M15 12h.01M12 9.5v5" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M5.5 4.5 3 7h4.5" />
      <path d="M12 7.5 12 12l3.5 1.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4.5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h4" />
      <path d="M16 8.5 20 12l-4 3.5" />
      <path d="M10 12h9.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9.5a6 6 0 0 0-12 0c0 4.5-1.7 5.5-1.7 5.5h15.4S18 14 18 9.5Z" />
      <path d="M10.3 18.5a2 2 0 0 0 3.4 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  document: (
    <>
      <path d="M7 3h7l4 4v14H7Z" />
      <path d="M14 3v4h4M10 12h5M10 16h5" />
    </>
  ),
  language: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M3.5 12h17" />
      <path d="M12 4c2.4 2.3 2.4 13.7 0 16M12 4c-2.4 2.3-2.4 13.7 0 16" />
    </>
  ),
  support: (
    <>
      <path d="M4 13a8 8 0 0 1 16 0" />
      <rect x="3" y="13" width="4" height="7" rx="2" />
      <rect x="17" y="13" width="4" height="7" rx="2" />
      <path d="M21 17v1a2 2 0 0 1-2 2h-3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4v4h-4" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v11" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 19h14" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
    </>
  ),
  'wifi-off': (
    <>
      <path d="M12 19.5h.01" />
      <path d="M8.5 16a5.6 5.6 0 0 1 7 0" />
      <path d="M5.6 12.9a9.4 9.4 0 0 1 4.5-2.4" />
      <path d="M3 3l18 18" />
      <path d="M17.6 9.5a9.4 9.4 0 0 1 2.8 2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 3 20h18Z" />
      <path d="M12 10v4M12 16.5v.01" />
    </>
  ),
  eye: (
    <>
      <path d="M3 12s3.5-6.5 9-6.5S21 12 21 12s-3.5 6.5-9 6.5S3 12 3 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M3 12s3.5-6.5 9-6.5S21 12 21 12s-3.5 6.5-9 6.5S3 12 3 12Z" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M3 3l18 18" />
    </>
  ),
  heart: <path d="M12 20s-7-4.5-9.2-9.2A5.2 5.2 0 0 1 12 7.1a5.2 5.2 0 0 1 9.2 3.7C19 15.5 12 20 12 20Z" />,
  'chevron-right': <path d="M9 6l6 6-6 6" />,
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  'filter-list': (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  navigate: (
    <>
      <path d="M12 3 4 20l8-4 8 4Z" />
      <path d="M12 16V7" />
    </>
  ),
  'arrow-up': (
    <>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </>
  ),
};

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 24, ...rest }: IconProps): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}

export const SERVICE_ICONS: IconName[] = [
  'taxi',
  'delivery',
  'food',
  'grocery',
  'pharmacy',
  'towing',
  'salon',
  'plumber',
  'handyman',
  'laundry',
  'bus',
  'carpool',
  'rental',
  'outstation',
  'pool',
];

export function serviceIconFor(slug: string): IconName {
  const normalized = slug.toLowerCase().replace(/\s+/g, '');
  if (normalized === 'transfer') {
    return 'transfer';
  }
  return (SERVICE_ICONS.find((name) => name === normalized) ?? 'taxi') as IconName;
}