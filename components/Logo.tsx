export function ScreenShareLogo({ className }: { className?: string }) {
  return (
    <svg
      width="36"
      height="24"
      viewBox="0 0 36 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Back screen — offset left/down, dimmer */}
      <rect x="0" y="4" width="22" height="16" rx="2.5" fill="#2a2a2a" />
      <rect x="0" y="4" width="22" height="16" rx="2.5" stroke="#555" strokeWidth="1" />

      {/* Front screen — offset right/up, bright */}
      <rect x="10" y="0" width="26" height="18" rx="2.5" fill="#111" />
      <rect x="10" y="0" width="26" height="18" rx="2.5" stroke="white" strokeWidth="1.5" />

      {/* Film notch top-left */}
      <rect x="13" y="0" width="2.5" height="2" rx="0.5" fill="white" />
      {/* Film notch top-right */}
      <rect x="31" y="0" width="2.5" height="2" rx="0.5" fill="white" />
      {/* Film notch bottom-left */}
      <rect x="13" y="16" width="2.5" height="2" rx="0.5" fill="white" />
      {/* Film notch bottom-right */}
      <rect x="31" y="16" width="2.5" height="2" rx="0.5" fill="white" />

      {/* Play triangle centered on front screen */}
      <path d="M20 6.5 L28 9 L20 11.5 Z" fill="white" />
    </svg>
  );
}
