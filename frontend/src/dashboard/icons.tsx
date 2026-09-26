import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V20h14v-9.5" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </IconBase>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M15 17H9a3 3 0 0 1-3-3v-2c0-3.6 1.8-6 6-6s6 2.4 6 6v2a3 3 0 0 1-3 3Z" />
      <path d="M10 17a2 2 0 0 0 4 0" />
    </IconBase>
  );
}

export function AdviceIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4v4" />
      <path d="m16 6-2.5 3.5" />
      <path d="m8 6 2.5 3.5" />
      <path d="M12 20v-4" />
      <path d="m16 18-2.5-3.5" />
      <path d="m8 18 2.5-3.5" />
      <circle cx="12" cy="12" r="2.8" />
    </IconBase>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7.5 8 6 8-6" />
    </IconBase>
  );
}

export function FollowIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M4 19a5 5 0 0 1 10 0" />
      <path d="M18 8v6" />
      <path d="M15 11h6" />
    </IconBase>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </IconBase>
  );
}

export function AtIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="7" />
      <path d="M15.5 15.5V9.8a2.8 2.8 0 1 0-2.2 2.7" />
      <path d="M15.5 12a2.5 2.5 0 0 0 5 0c0-4.7-3.8-8.5-8.5-8.5S3.5 7.3 3.5 12 7.3 20.5 12 20.5c1.8 0 3.3-.4 4.7-1.3" />
    </IconBase>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 11a8 8 0 1 0 2 5.3" />
      <path d="M20 4v7h-7" />
    </IconBase>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
    </IconBase>
  );
}

export function ReplyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 17 4 12l5-5" />
      <path d="M4 12h9a7 7 0 0 1 7 7" />
    </IconBase>
  );
}

export function ThumbUpIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 21H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3v10Z" />
      <path d="M8 11l3-8 2 1v4h5a2 2 0 0 1 2 2l-1 7a2 2 0 0 1-2 2H8" />
    </IconBase>
  );
}

export function ThumbDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 3H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3V3Z" />
      <path d="m8 13 3 8 2-1v-4h5a2 2 0 0 0 2-2l-1-7a2 2 0 0 0-2-2H8" />
    </IconBase>
  );
}

export function CommentIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 17v3l3-2h8a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v4a4 4 0 0 0 3 4Z" />
    </IconBase>
  );
}

export function BookmarkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />
    </IconBase>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="m8 11 8-4" />
      <path d="m8 13 8 4" />
    </IconBase>
  );
}

export function PaperPlaneIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m22 2-10 11" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </IconBase>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 2.7 20h18.6L12 3Z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m5 16 4.5-4 3.5 3 2.5-2.5L19 16" />
    </IconBase>
  );
}

export function XIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </IconBase>
  );
}

export function MoreHorizontalIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.9 4.9 1.4 1.4" />
      <path d="m17.7 17.7 1.4 1.4" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.9 19.1 1.4-1.4" />
      <path d="m17.7 6.3 1.4-1.4" />
    </IconBase>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </IconBase>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </IconBase>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </IconBase>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 6 6 6-6 6" />
    </IconBase>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m14 5 5 5" />
      <path d="M4 20h4l11-11a1.5 1.5 0 0 0 0-2.1l-2.9-2.9a1.5 1.5 0 0 0-2.1 0L4 15v5Z" />
    </IconBase>
  );
}
