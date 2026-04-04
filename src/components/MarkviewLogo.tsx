interface MarkviewLogoProps {
  className?: string;
}

export function MarkviewLogo({ className = "h-7 w-auto" }: MarkviewLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 180"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="sparkle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C9A94E" />
          <stop offset="100%" stopColor="#A8892F" />
        </linearGradient>
      </defs>

      {/* Markview text — uses currentColor to adapt to theme */}
      <text
        x="20"
        y="130"
        fontFamily="'Montserrat', system-ui, sans-serif"
        fontSize="128"
        fontWeight="800"
        fill="currentColor"
        stroke="#B8961F"
        strokeWidth="2"
        letterSpacing="-3"
      >
        Markview
      </text>

      {/* Sparkle stars — gold accent, stays constant */}
      <path
        d="M558 42 L564 58 L580 64 L564 70 L558 86 L552 70 L536 64 L552 58 Z"
        fill="url(#sparkle)"
        stroke="#8B7322"
        strokeWidth="1.5"
      />
      <path
        d="M596 18 L600 28 L610 32 L600 36 L596 46 L592 36 L582 32 L592 28 Z"
        fill="url(#sparkle)"
        stroke="#8B7322"
        strokeWidth="1.2"
      />
      <path
        d="M608 56 L611 63 L618 66 L611 69 L608 76 L605 69 L598 66 L605 63 Z"
        fill="url(#sparkle)"
        stroke="#8B7322"
        strokeWidth="1"
      />
    </svg>
  );
}
