import * as React from "react";

export function Logomark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Piring / Lingkaran Luar */}
      <circle cx="12" cy="12" r="9" />
      {/* Lingkaran Piring Dalam */}
      <circle cx="12" cy="12" r="4.5" strokeDasharray="2 2" />
      {/* Sudut Bidik Kamera (Focus / Snap corners) */}
      <path d="M8 3.5h-2a2.5 2.5 0 0 0-2.5 2.5v2" strokeWidth="1.5" />
      <path d="M16 3.5h2a2.5 2.5 0 0 1 2.5 2.5v2" strokeWidth="1.5" />
      <path d="M8 20.5h-2a2.5 2.5 0 0 1-2.5-2.5v-2" strokeWidth="1.5" />
      <path d="M16 20.5h2a2.5 2.5 0 0 0 2.5-2.5v-2" strokeWidth="1.5" />
    </svg>
  );
}

