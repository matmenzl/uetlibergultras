import { SVGProps } from 'react';

interface SymbolProps extends SVGProps<SVGSVGElement> {
  primaryColor?: string;
  secondaryColor?: string;
}

// First ascent - flat design single summit with flag
export function MountainSingle({ primaryColor = 'currentColor', secondaryColor, ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 60" fill="none" {...props}>
      {/* Circular background */}
      <circle cx="30" cy="30" r="28" fill={primaryColor} opacity={0.15} />
      
      {/* Back mountain */}
      <path
        d="M10 46 L22 28 L30 34 L42 24 L54 46 Z"
        fill={primaryColor}
        opacity={0.4}
      />
      
      {/* Front mountain */}
      <path
        d="M6 46 L18 30 L26 36 L34 22 L42 30 L50 46 Z"
        fill={primaryColor}
      />
      
      {/* Snow cap */}
      <path
        d="M30 22 L34 22 L32 26 L28 28 L26 26 Z"
        fill="white"
        opacity={0.6}
      />
      
      {/* Summit flag */}
      <rect x="33" y="14" width="1.8" height="10" rx="0.9" fill={primaryColor} opacity={0.7} />
      <path d="M35 14 L43 17 L35 20 Z" fill={primaryColor} opacity={0.85} />
      
      {/* Ground line */}
      <path d="M4 46 L56 46" fill="none" stroke={primaryColor} strokeWidth="2" opacity={0.25} />
    </svg>
  );
}

// 5 runs - ridge with 5 dots
export function MountainFive({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 60" fill="none" {...props}>
      {/* Circular background */}
      <circle cx="30" cy="30" r="28" fill={primaryColor} opacity={0.15} />
      
      {/* Back ridge */}
      <path
        d="M4 48 L14 32 L24 38 L34 28 L44 34 L56 48 Z"
        fill={primaryColor}
        opacity={0.35}
      />
      
      {/* Front ridge */}
      <path
        d="M2 48 L12 36 L20 40 L30 30 L40 36 L50 32 L58 48 Z"
        fill={primaryColor}
      />
      
      {/* Snow caps */}
      <path d="M28 30 L30 30 L29 33 Z" fill="white" opacity={0.6} />
      <path d="M48 32 L50 32 L49 35 Z" fill="white" opacity={0.5} />
      
      {/* 5 summit dots */}
      <circle cx="12" cy="34" r="2.5" fill="white" opacity={0.9} />
      <circle cx="21" cy="38" r="2.5" fill="white" opacity={0.9} />
      <circle cx="30" cy="28" r="2.5" fill="white" opacity={0.9} />
      <circle cx="40" cy="34" r="2.5" fill="white" opacity={0.9} />
      <circle cx="50" cy="30" r="2.5" fill="white" opacity={0.9} />
      
      {/* Ground line */}
      <path d="M4 48 L56 48" fill="none" stroke={primaryColor} strokeWidth="2" opacity={0.25} />
    </svg>
  );
}

// 10 runs - layered mountains with number badge
export function MountainTen({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 60" fill="none" {...props}>
      {/* Circular background */}
      <circle cx="30" cy="30" r="28" fill={primaryColor} opacity={0.15} />
      
      {/* Far ridge */}
      <path
        d="M6 48 L18 30 L28 36 L38 26 L48 32 L56 48 Z"
        fill={primaryColor}
        opacity={0.25}
      />
      
      {/* Mid ridge */}
      <path
        d="M4 48 L16 34 L24 38 L34 28 L44 34 L54 48 Z"
        fill={primaryColor}
        opacity={0.5}
      />
      
      {/* Front mountain */}
      <path
        d="M2 48 L14 36 L22 40 L32 30 L42 38 L52 48 Z"
        fill={primaryColor}
      />
      
      {/* Snow caps */}
      <path d="M30 30 L32 30 L31 33 Z" fill="white" opacity={0.6} />
      
      {/* Number badge */}
      <circle cx="30" cy="16" r="8" fill={primaryColor} opacity={0.85} />
      <text x="30" y="19.5" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="system-ui">10</text>
      
      {/* Ground line */}
      <path d="M4 48 L56 48" fill="none" stroke={primaryColor} strokeWidth="2" opacity={0.25} />
    </svg>
  );
}

// 25 runs - panoramic range with number
export function MountainTwentyFive({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 60" fill="none" {...props}>
      {/* Circular background */}
      <circle cx="30" cy="30" r="28" fill={primaryColor} opacity={0.15} />
      
      {/* Far range */}
      <path
        d="M2 48 L10 32 L18 38 L26 28 L34 34 L42 26 L50 32 L58 48 Z"
        fill={primaryColor}
        opacity={0.2}
      />
      
      {/* Mid range */}
      <path
        d="M2 48 L12 36 L20 40 L28 30 L36 36 L44 28 L52 34 L58 48 Z"
        fill={primaryColor}
        opacity={0.45}
      />
      
      {/* Front range */}
      <path
        d="M4 48 L14 38 L22 42 L30 32 L38 38 L46 30 L54 48 Z"
        fill={primaryColor}
      />
      
      {/* Snow caps */}
      <path d="M28 32 L30 32 L29 35 Z" fill="white" opacity={0.6} />
      <path d="M44 30 L46 30 L45 33 Z" fill="white" opacity={0.5} />
      
      {/* Number badge */}
      <circle cx="30" cy="16" r="9" fill={primaryColor} opacity={0.85} />
      <text x="30" y="19.5" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="system-ui">25</text>
      
      {/* Ground line */}
      <path d="M4 48 L56 48" fill="none" stroke={primaryColor} strokeWidth="2" opacity={0.25} />
    </svg>
  );
}

// 50 runs - epic panorama with tower
export function MountainFifty({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 60" fill="none" {...props}>
      {/* Circular background */}
      <circle cx="30" cy="30" r="28" fill={primaryColor} opacity={0.15} />
      
      {/* Far range */}
      <path
        d="M2 48 L8 34 L16 38 L24 28 L32 34 L40 26 L48 32 L58 48 Z"
        fill={primaryColor}
        opacity={0.2}
      />
      
      {/* Mid range */}
      <path
        d="M2 48 L10 36 L20 40 L30 30 L40 36 L50 28 L58 48 Z"
        fill={primaryColor}
        opacity={0.45}
      />
      
      {/* Front range */}
      <path
        d="M4 48 L16 38 L24 42 L34 32 L44 38 L54 48 Z"
        fill={primaryColor}
      />
      
      {/* Snow caps */}
      <path d="M32 32 L34 32 L33 35 Z" fill="white" opacity={0.6} />
      
      {/* Uetliberg tower */}
      <rect x="33" y="20" width="3" height="12" rx="0.5" fill={primaryColor} opacity={0.7} />
      <rect x="31.5" y="17" width="6" height="3" rx="1" fill="white" opacity={0.9} />
      <rect x="33.5" y="12" width="2" height="5" rx="1" fill={primaryColor} opacity={0.6} />
      
      {/* Number badge */}
      <circle cx="18" cy="16" r="9" fill={primaryColor} opacity={0.85} />
      <text x="18" y="19.5" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="system-ui">50</text>
      
      {/* Ground line */}
      <path d="M4 48 L56 48" fill="none" stroke={primaryColor} strokeWidth="2" opacity={0.25} />
    </svg>
  );
}

// 100 runs - ultimate emblem with tower and crown
export function MountainHundred({ primaryColor = 'currentColor', secondaryColor = 'hsl(280 68% 60%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 60" fill="none" {...props}>
      {/* Circular background with secondary glow */}
      <circle cx="30" cy="30" r="28" fill={secondaryColor} opacity={0.1} />
      <circle cx="30" cy="30" r="28" fill={primaryColor} opacity={0.12} />
      
      {/* Far range */}
      <path
        d="M2 48 L8 34 L16 38 L24 28 L32 34 L40 26 L48 32 L58 48 Z"
        fill={secondaryColor}
        opacity={0.2}
      />
      
      {/* Mid range */}
      <path
        d="M2 48 L10 36 L20 40 L30 30 L40 36 L50 28 L58 48 Z"
        fill={primaryColor}
        opacity={0.4}
      />
      
      {/* Front range */}
      <path
        d="M4 48 L14 38 L22 42 L32 32 L42 38 L52 48 Z"
        fill={primaryColor}
      />
      
      {/* Snow caps */}
      <path d="M30 32 L32 32 L31 35 Z" fill="white" opacity={0.6} />
      
      {/* Uetliberg tower */}
      <rect x="31" y="20" width="3" height="12" rx="0.5" fill={secondaryColor} opacity={0.8} />
      <rect x="29.5" y="17" width="6" height="3" rx="1" fill="white" opacity={0.9} />
      <rect x="31.5" y="12" width="2" height="5" rx="1" fill={secondaryColor} opacity={0.6} />
      
      {/* Crown / star accent */}
      <path
        d="M22 10 L24 6 L26 10 L30 4 L34 10 L36 6 L38 10"
        fill="none"
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
      
      {/* Number banner */}
      <rect x="12" y="12" width="18" height="10" rx="3" fill={primaryColor} opacity={0.85} />
      <text x="21" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="system-ui">100</text>
      
      {/* Ground line */}
      <path d="M4 48 L56 48" fill="none" stroke={primaryColor} strokeWidth="2" opacity={0.25} />
    </svg>
  );
}

// All segments - trail network on mountain (flat design)
export function PathsSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 60" fill="none" {...props}>
      {/* Circular background */}
      <circle cx="30" cy="30" r="28" fill={primaryColor} opacity={0.15} />
      
      {/* Mountain base */}
      <path
        d="M6 48 L20 32 L30 38 L40 28 L54 48 Z"
        fill={primaryColor}
        opacity={0.3}
      />
      
      {/* Trail paths */}
      <path d="M14 48 L22 38 L30 36" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity={0.8} />
      <path d="M30 36 L38 32 L46 48" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity={0.8} />
      <path d="M22 48 L30 36 L30 48" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity={0.6} />
      <path d="M30 36 L36 48" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity={0.6} />
      
      {/* Summit marker */}
      <circle cx="30" cy="22" r="5" fill={primaryColor} />
      <circle cx="30" cy="22" r="2.5" fill="white" opacity={0.9} />
      <path d="M30 27 L30 36" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Ground line */}
      <path d="M4 48 L56 48" fill="none" stroke={primaryColor} strokeWidth="2" opacity={0.25} />
    </svg>
  );
}
