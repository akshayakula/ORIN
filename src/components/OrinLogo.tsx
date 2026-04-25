import { cn } from "../lib/cn";

interface OrinLogoProps {
  size?: number;
  className?: string;
  spin?: boolean;
  /** When true, the iris pulses subtly. */
  alive?: boolean;
}

/**
 * ORIN brand mark — a modern aperture / iris lens.
 * Outer ring, six aperture blades, glowing cyan pupil with catch-light.
 */
export default function OrinLogo({
  size = 32,
  className,
  spin = false,
  alive = true,
}: OrinLogoProps) {
  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={cn(
          "absolute inset-0",
          spin && "animate-spin-slow",
          "drop-shadow-[0_0_8px_rgba(148,163,184,0.25)]",
        )}
      >
        <defs>
          <radialGradient id="orin-iris" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="55%" stopColor="#94a3b8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id="orin-ring"
            x1="0"
            y1="0"
            x2="64"
            y2="64"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#cbd5e1" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
          <linearGradient
            id="orin-blade"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0" stopColor="#0a0f24" />
            <stop offset="1" stopColor="#02030a" />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r="29"
          stroke="url(#orin-ring)"
          strokeWidth="2"
          fill="#02030a"
        />
        <circle
          cx="32"
          cy="32"
          r="25.5"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <g transform="translate(32 32)">
          <g
            fill="url(#orin-blade)"
            stroke="url(#orin-ring)"
            strokeWidth="1"
            strokeLinejoin="round"
          >
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <path
                key={deg}
                d="M 0 -22 L 19 -10 L 0 0 Z"
                transform={`rotate(${deg})`}
              />
            ))}
          </g>
        </g>
        <circle cx="32" cy="32" r="9" fill="url(#orin-iris)">
          {alive && (
            <animate
              attributeName="r"
              values="8.5;9.6;8.5"
              dur="3.6s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        <circle cx="32" cy="32" r="3.5" fill="#cbd5e1" />
        <circle cx="29.5" cy="29.5" r="1.2" fill="#ffffff" opacity="0.85" />
        <g
          stroke="rgba(148,163,184,0.35)"
          strokeWidth="1"
          strokeLinecap="round"
        >
          <line x1="32" y1="3" x2="32" y2="7" />
          <line x1="32" y1="57" x2="32" y2="61" />
          <line x1="3" y1="32" x2="7" y2="32" />
          <line x1="57" y1="32" x2="61" y2="32" />
        </g>
      </svg>
    </span>
  );
}
