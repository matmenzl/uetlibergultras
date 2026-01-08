import { SVGProps } from 'react';

interface SymbolProps extends SVGProps<SVGSVGElement> {
  primaryColor?: string;
  secondaryColor?: string;
}

// Crown for kings/legends
export function CrownSymbol({ primaryColor = 'currentColor', secondaryColor = 'hsl(45 93% 47%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Crown body */}
      <path
        d="M8 38L12 18L22 28L30 12L38 28L48 18L52 38H8Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Crown base */}
      <rect x="8" y="38" width="44" height="8" rx="2" fill={primaryColor} stroke="hsl(0 0% 20%)" strokeWidth="2" />
      {/* Jewels */}
      <circle cx="30" cy="28" r="4" fill={secondaryColor} stroke="hsl(0 0% 20%)" strokeWidth="1.5" />
      <circle cx="18" cy="32" r="2.5" fill={secondaryColor} stroke="hsl(0 0% 20%)" strokeWidth="1" />
      <circle cx="42" cy="32" r="2.5" fill={secondaryColor} stroke="hsl(0 0% 20%)" strokeWidth="1" />
      {/* Peak gems */}
      <circle cx="12" cy="18" r="2" fill={secondaryColor} stroke="hsl(0 0% 20%)" strokeWidth="1" />
      <circle cx="30" cy="12" r="2.5" fill={secondaryColor} stroke="hsl(0 0% 20%)" strokeWidth="1" />
      <circle cx="48" cy="18" r="2" fill={secondaryColor} stroke="hsl(0 0% 20%)" strokeWidth="1" />
    </svg>
  );
}

// Compass for alternativliga
export function CompassSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Outer ring */}
      <circle
        cx="30"
        cy="25"
        r="20"
        fill="hsl(0 0% 95%)"
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
      />
      {/* Inner ring */}
      <circle
        cx="30"
        cy="25"
        r="14"
        fill="none"
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
      />
      {/* North pointer */}
      <path
        d="M30 11L34 25L30 29L26 25L30 11Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* South pointer */}
      <path
        d="M30 39L34 25L30 21L26 25L30 39Z"
        fill="hsl(0 0% 80%)"
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Center dot */}
      <circle cx="30" cy="25" r="3" fill="hsl(0 0% 20%)" />
      {/* Direction markers */}
      <text x="30" y="9" textAnchor="middle" fill="hsl(0 0% 20%)" fontSize="6" fontWeight="bold">N</text>
      <text x="30" y="47" textAnchor="middle" fill="hsl(0 0% 20%)" fontSize="6" fontWeight="bold">S</text>
      <text x="8" y="27" textAnchor="middle" fill="hsl(0 0% 20%)" fontSize="6" fontWeight="bold">W</text>
      <text x="52" y="27" textAnchor="middle" fill="hsl(0 0% 20%)" fontSize="6" fontWeight="bold">E</text>
    </svg>
  );
}
