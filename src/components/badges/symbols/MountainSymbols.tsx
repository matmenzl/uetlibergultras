import { SVGProps } from 'react';
import { UetlibergHorizon } from './UetlibergBase';

interface SymbolProps extends SVGProps<SVGSVGElement> {
  primaryColor?: string;
  secondaryColor?: string;
}

// First ascent - flat design single summit
export function MountainSingle({ primaryColor = 'currentColor', secondaryColor, ...props }: SymbolProps) {
  // Derive darker/lighter shades from primary for flat layering
  return (
    <svg viewBox="0 0 60 60" fill="none" {...props}>
      {/* Circular background */}
      <circle cx="30" cy="30" r="28" fill={primaryColor} opacity={0.15} />
      
      {/* Back mountain - darker shade */}
      <path
        d="M10 46 L22 28 L30 34 L42 24 L54 46 Z"
        fill={primaryColor}
        opacity={0.4}
      />
      
      {/* Front mountain - full color */}
      <path
        d="M6 46 L18 30 L26 36 L34 22 L42 30 L50 46 Z"
        fill={primaryColor}
      />
      
      {/* Snow cap highlight */}
      <path
        d="M30 22 L34 22 L32 26 L28 28 L26 26 Z"
        fill="white"
        opacity={0.6}
      />
      
      {/* Summit flag */}
      <rect x="33" y="14" width="1.8" height="10" rx="0.9" fill={primaryColor} opacity={0.7} />
      <path
        d="M35 14 L43 17 L35 20 Z"
        fill={primaryColor}
        opacity={0.85}
      />
      
      {/* Ground line */}
      <path
        d="M4 46 L56 46"
        fill="none"
        stroke={primaryColor}
        strokeWidth="2"
        opacity={0.25}
      />
    </svg>
  );
}

// 5 runs - ridge with 5 summit marks
export function MountainFive({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Consistent Uetliberg horizon base */}
      <UetlibergHorizon opacity={0.1} />
      {/* Mountain ridge */}
      <path
        d="M2 44 L10 32 L18 36 L26 28 L34 32 L42 26 L50 30 L58 44 Z"
        fill={primaryColor}
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* 5 summit markers */}
      <circle cx="10" cy="30" r="2" fill="hsl(0 0% 95%)" stroke="hsl(0 0% 15%)" strokeWidth="1.5" />
      <circle cx="20" cy="34" r="2" fill="hsl(0 0% 95%)" stroke="hsl(0 0% 15%)" strokeWidth="1.5" />
      <circle cx="30" cy="26" r="2" fill="hsl(0 0% 95%)" stroke="hsl(0 0% 15%)" strokeWidth="1.5" />
      <circle cx="40" cy="30" r="2" fill="hsl(0 0% 95%)" stroke="hsl(0 0% 15%)" strokeWidth="1.5" />
      <circle cx="50" cy="28" r="2" fill="hsl(0 0% 95%)" stroke="hsl(0 0% 15%)" strokeWidth="1.5" />
      {/* Number */}
      <text x="30" y="18" textAnchor="middle" fill="hsl(0 0% 15%)" fontSize="10" fontWeight="bold" fontFamily="system-ui">5</text>
    </svg>
  );
}

// 10 runs - double ridge with elevation profile
export function MountainTen({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Consistent Uetliberg horizon base */}
      <UetlibergHorizon opacity={0.08} />
      {/* Back ridge */}
      <path
        d="M8 44 L20 30 L32 36 L44 28 L56 44 Z"
        fill="hsl(45 60% 35%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Front ridge */}
      <path
        d="M2 44 L14 34 L26 38 L38 30 L52 44 Z"
        fill={primaryColor}
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Elevation profile line */}
      <path
        d="M6 22 L14 16 L22 20 L30 12 L38 18 L46 14 L54 20"
        fill="none"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Number badge */}
      <circle cx="30" cy="12" r="6" fill="hsl(0 0% 95%)" stroke="hsl(0 0% 15%)" strokeWidth="2" />
      <text x="30" y="15" textAnchor="middle" fill="hsl(0 0% 15%)" fontSize="7" fontWeight="bold" fontFamily="system-ui">10</text>
    </svg>
  );
}

// 25 runs - mountain range panorama
export function MountainTwentyFive({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Consistent Uetliberg horizon base */}
      <UetlibergHorizon opacity={0.06} />
      {/* Far range */}
      <path
        d="M0 44 L8 32 L16 36 L24 28 L32 32 L40 26 L48 30 L56 24 L60 44 Z"
        fill="hsl(45 50% 30%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Mid range */}
      <path
        d="M0 44 L12 34 L22 38 L30 30 L38 34 L48 28 L60 44 Z"
        fill="hsl(45 60% 40%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Front range - Uetliberg prominent */}
      <path
        d="M4 44 L18 36 L28 40 L36 32 L46 38 L56 44 Z"
        fill={primaryColor}
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Number */}
      <text x="30" y="18" textAnchor="middle" fill="hsl(0 0% 15%)" fontSize="12" fontWeight="bold" fontFamily="system-ui">25</text>
    </svg>
  );
}

// 50 runs - epic panorama with tower silhouette
export function MountainFifty({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Consistent Uetliberg horizon base */}
      <UetlibergHorizon opacity={0.05} />
      {/* Layered ranges */}
      <path d="M0 46 L10 34 L20 38 L30 28 L40 34 L50 30 L60 46 Z" fill="hsl(45 40% 25%)" stroke="hsl(0 0% 15%)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M0 46 L15 36 L25 40 L35 32 L45 36 L55 34 L60 46 Z" fill="hsl(45 50% 35%)" stroke="hsl(0 0% 15%)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M2 46 L16 38 L26 42 L34 36 L44 40 L54 46 Z" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Uetliberg tower */}
      <rect x="32" y="20" width="4" height="16" fill="hsl(0 0% 15%)" />
      <rect x="30" y="16" width="8" height="4" fill="hsl(0 0% 15%)" />
      <line x1="34" y1="16" x2="34" y2="10" stroke="hsl(0 0% 15%)" strokeWidth="2" />
      {/* Number */}
      <text x="16" y="18" textAnchor="middle" fill="hsl(0 0% 15%)" fontSize="12" fontWeight="bold" fontFamily="system-ui">50</text>
    </svg>
  );
}

// 100 runs - ultimate Uetliberg emblem
export function MountainHundred({ primaryColor = 'currentColor', secondaryColor = 'hsl(280 68% 60%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 55" fill="none" {...props}>
      {/* Consistent Uetliberg horizon base */}
      <g transform="translate(0, 5)">
        <UetlibergHorizon opacity={0.06} />
      </g>
      {/* Decorative border arc */}
      <path
        d="M8 48 Q30 52 52 48"
        fill="none"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
      />
      {/* Mountain with tower */}
      <path
        d="M6 46 L20 32 L28 36 L36 28 L44 32 L54 46 Z"
        fill={primaryColor}
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Tower */}
      <rect x="34" y="16" width="4" height="12" fill="hsl(0 0% 15%)" />
      <rect x="32" y="12" width="8" height="4" fill={secondaryColor} stroke="hsl(0 0% 15%)" strokeWidth="1.5" />
      {/* 100 banner */}
      <path
        d="M10 10 L50 10 L48 18 L50 26 L10 26 L12 18 Z"
        fill="hsl(0 0% 95%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
      />
      <text x="30" y="21" textAnchor="middle" fill="hsl(0 0% 15%)" fontSize="10" fontWeight="bold" fontFamily="system-ui">100</text>
    </svg>
  );
}

// All segments - trail network on mountain
export function PathsSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Consistent Uetliberg horizon base */}
      <UetlibergHorizon opacity={0.1} />
      {/* Mountain base */}
      <path
        d="M4 44 L20 28 L30 34 L40 26 L56 44 Z"
        fill="hsl(0 0% 90%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Trail network */}
      <path d="M12 44 L20 36 L30 34" fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 34 L40 30 L48 44" fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 44 L30 34 L30 44" fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 34 L38 44" fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Summit marker */}
      <circle cx="30" cy="20" r="4" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2" />
      <line x1="30" y1="24" x2="30" y2="34" stroke={primaryColor} strokeWidth="2.5" />
    </svg>
  );
}
