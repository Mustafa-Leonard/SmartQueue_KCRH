import React from 'react';

const iconProps = (size = 18, color = 'currentColor', strokeWidth = 2) => ({
  width: size,
  height: size,
  stroke: color,
  strokeWidth: strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
});

export const DashboardIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

export const BranchIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

export const CounterIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

export const ServiceIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 0 0 .1.3" />
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

export const UsersIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const CalendarIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const AnalyticsIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export const TicketIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v14" strokeDasharray="2 2" />
  </svg>
);

export const UserIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const LogOutIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const ClockIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const PlusIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const EditIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const TrashIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const SearchIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const BellIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export const FilterIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export const RefreshIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export const DownloadIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const CheckIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const ActiveDotIcon = ({ size = 8, color = 'currentColor', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 8 8" fill={color} style={style}>
    <circle cx="4" cy="4" r="4" />
  </svg>
);

export const ArrowRightIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const AlertIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const CheckCircleIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const SkipIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

export const PlayIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export const StopIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

export const BanIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

/* ── Hospital Brand / KCRH Logo ───────────────────────── */
export const KCRHLogo = ({ size = 40, color = 'currentColor', style = {} }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} fill="none" style={style}>
    <rect width="64" height="64" rx="12" fill="url(#logoGrad)" />
    <path d="M32 14v36M14 32h36" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    <circle cx="32" cy="32" r="22" stroke="#fff" strokeWidth="3" strokeDasharray="4 3" fill="none" />
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="64" y2="64">
        <stop offset="0%" stopColor="hsl(172, 66%, 36%)" />
        <stop offset="100%" stopColor="hsl(226, 68%, 38%)" />
      </linearGradient>
    </defs>
  </svg>
);

/* ── Megaphone / Volume ───────────────────────────────── */
export const MegaphoneIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-3 1.73v14a2 2 0 0 0 3 1.73l7-4A2 2 0 0 0 21 16z" />
    <path d="M3 14h3v-4H3" strokeLinecap="round" />
    <circle cx="17" cy="12" r="1" fill={color} />
  </svg>
);

/* ── Trending Up / Down (for analytics) ────────────────── */
export const TrendingUpIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export const TrendingDownIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

export const ActivityIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const InfoIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const TransferIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

/* ── File Text / Documents ────────────────────────────── */
export const FileTextIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

/* ── Message / Feedback ───────────────────────────────── */
export const MessageIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

/* ── History / Clock ──────────────────────────────────── */
export const HistoryIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/* ── Settings / Gear ──────────────────────────────────── */
export const SettingsIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/* ── Map Pin / Location ───────────────────────────────── */
export const MapPinIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/* ── Pause ────────────────────────────────────────────── */
export const PauseIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

/* ── Cross / X ────────────────────────────────────────── */
export const CrossIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ── Phone ────────────────────────────────────────────── */
export const PhoneIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

/* ── Eye / View ───────────────────────────────────────── */
export const EyeIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/* ── Mail / Envelope ──────────────────────────────────── */
export const MailIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

/* ── Save / Floppy ────────────────────────────────────── */
export const SaveIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

/* ── Star / Rating ────────────────────────────────────── */
export const StarIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ── Walk Icon ────────────────────────────────────────── */
export const WalkIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <circle cx="13" cy="4" r="2" />
    <path d="M15 21v-4l-2-3 2-3v-3a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v3l-2 3v4" />
    <line x1="8" y1="15" x2="16" y2="15" />
  </svg>
);

/* ── QR Code Icon ─────────────────────────────────────── */
export const QrCodeIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <line x1="6" y1="11" x2="6" y2="13" />
    <line x1="11" y1="6" x2="13" y2="6" />
  </svg>
);

/* ── Arrow Left (Back) ────────────────────────────────── */
export const ArrowLeftIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

/* ── Lock / Security ──────────────────────────────────── */
export const LockIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* ── Camera ────────────────────────────────────────────── */
export const CameraIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

/* ── Volume / Speaker ─────────────────────────────────── */
export const VolumeIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

/* ── Volume X / Mute ──────────────────────────────────── */
export const VolumeXIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

/* ── Send / Submit ────────────────────────────────────── */
export const SendIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

/* ── Lightbulb / Suggestion ──────────────────────────── */
export const LightbulbIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>
);

/* ── Thumbs Up ────────────────────────────────────────── */
export const ThumbsUpIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

/* ── Thumbs Down ──────────────────────────────────────── */
export const ThumbsDownIcon = ({ size = 18, color = 'currentColor', style = {} }) => (
  <svg {...iconProps(size, color)} viewBox="0 0 24 24" style={style}>
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z" />
    <path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
  </svg>
);
