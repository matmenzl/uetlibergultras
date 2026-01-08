import { SVGProps } from 'react';

interface SymbolProps extends SVGProps<SVGSVGElement> {
  primaryColor?: string;
  secondaryColor?: string;
}

// Founding star for founding_member
export function StarFoundingSymbol({ primaryColor = 'currentColor', secondaryColor = 'hsl(45 93% 47%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 55" fill="none" {...props}>
      {/* Large star */}
      <path
        d="M30 4L35 20L52 20L38 30L43 46L30 36L17 46L22 30L8 20L25 20L30 4Z"
        fill={secondaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner star highlight */}
      <path
        d="M30 12L33 22L44 22L35 28L38 38L30 32L22 38L25 28L16 22L27 22L30 12Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* F for founding */}
      <text
        x="30"
        y="30"
        textAnchor="middle"
        fill="white"
        stroke="hsl(0 0% 20%)"
        strokeWidth="0.5"
        fontSize="10"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        F
      </text>
    </svg>
  );
}

// Trophy with number for pioneer badges
export function TrophyTenSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Trophy cup */}
      <path
        d="M18 8H42V20C42 28 36 34 30 34C24 34 18 28 18 20V8Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2"
      />
      {/* Left handle */}
      <path
        d="M18 12H14C10 12 8 16 8 20C8 24 10 26 14 26H18"
        fill="none"
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
      />
      {/* Right handle */}
      <path
        d="M42 12H46C50 12 52 16 52 20C52 24 50 26 46 26H42"
        fill="none"
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
      />
      {/* Stem */}
      <rect x="26" y="34" width="8" height="6" fill="hsl(0 0% 20%)" />
      {/* Base */}
      <rect x="20" y="40" width="20" height="6" rx="2" fill="hsl(0 0% 20%)" />
      {/* Number */}
      <text
        x="30"
        y="24"
        textAnchor="middle"
        fill="white"
        stroke="hsl(0 0% 20%)"
        strokeWidth="0.5"
        fontSize="12"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        10
      </text>
    </svg>
  );
}

export function TrophyTwentyFiveSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      <path
        d="M18 8H42V20C42 28 36 34 30 34C24 34 18 28 18 20V8Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2"
      />
      <path
        d="M18 12H14C10 12 8 16 8 20C8 24 10 26 14 26H18"
        fill="none"
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
      />
      <path
        d="M42 12H46C50 12 52 16 52 20C52 24 50 26 46 26H42"
        fill="none"
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
      />
      <rect x="26" y="34" width="8" height="6" fill="hsl(0 0% 20%)" />
      <rect x="20" y="40" width="20" height="6" rx="2" fill="hsl(0 0% 20%)" />
      <text
        x="30"
        y="24"
        textAnchor="middle"
        fill="white"
        stroke="hsl(0 0% 20%)"
        strokeWidth="0.5"
        fontSize="10"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        25
      </text>
    </svg>
  );
}

export function TrophyFiftySymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      <path
        d="M18 8H42V20C42 28 36 34 30 34C24 34 18 28 18 20V8Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2"
      />
      <path
        d="M18 12H14C10 12 8 16 8 20C8 24 10 26 14 26H18"
        fill="none"
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
      />
      <path
        d="M42 12H46C50 12 52 16 52 20C52 24 50 26 46 26H42"
        fill="none"
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
      />
      <rect x="26" y="34" width="8" height="6" fill="hsl(0 0% 20%)" />
      <rect x="20" y="40" width="20" height="6" rx="2" fill="hsl(0 0% 20%)" />
      <text
        x="30"
        y="24"
        textAnchor="middle"
        fill="white"
        stroke="hsl(0 0% 20%)"
        strokeWidth="0.5"
        fontSize="10"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        50
      </text>
    </svg>
  );
}
