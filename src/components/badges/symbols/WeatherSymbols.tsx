import { SVGProps } from 'react';

interface SymbolProps extends SVGProps<SVGSVGElement> {
  primaryColor?: string;
  secondaryColor?: string;
}

// Early bird - mountain horizon at dawn with sun behind ridge
export function SunriseSymbol({ primaryColor = 'currentColor', secondaryColor = 'hsl(199 89% 48%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Dawn sky gradient (simplified as bands) */}
      <rect x="0" y="0" width="60" height="20" fill={secondaryColor} opacity="0.3" />
      <rect x="0" y="20" width="60" height="10" fill={primaryColor} opacity="0.4" />
      {/* Sun rising behind ridge */}
      <circle cx="30" cy="26" r="10" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2" />
      {/* Mountain ridge silhouette */}
      <path
        d="M0 46 L12 32 L22 38 L30 28 L38 34 L48 30 L60 46 Z"
        fill="hsl(0 0% 20%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Horizon line */}
      <line x1="0" y1="46" x2="60" y2="46" stroke="hsl(0 0% 15%)" strokeWidth="2" />
    </svg>
  );
}

// Night owl - mountain under night sky
export function MoonSymbol({ primaryColor = 'currentColor', secondaryColor = 'hsl(45 93% 70%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Night sky */}
      <rect x="0" y="0" width="60" height="50" fill={primaryColor} rx="4" />
      {/* Mountain silhouette */}
      <path
        d="M0 46 L16 30 L26 36 L36 26 L46 32 L60 46 Z"
        fill="hsl(230 30% 15%)"
        stroke="hsl(0 0% 10%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Moon crescent */}
      <path
        d="M42 18 C42 10 36 4 28 4 C32 8 34 14 34 20 C34 22 33 24 32 26 C40 26 46 22 42 18 Z"
        fill={secondaryColor}
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
      />
      {/* Stars as simple dots */}
      <circle cx="12" cy="12" r="1.5" fill={secondaryColor} />
      <circle cx="52" cy="8" r="1" fill={secondaryColor} />
      <circle cx="20" cy="20" r="1" fill={secondaryColor} />
    </svg>
  );
}

// Snow bunny - mountain with snow layer
export function SnowflakeSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Mountain base */}
      <path
        d="M4 46 L20 28 L30 34 L40 26 L56 46 Z"
        fill="hsl(0 0% 70%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Snow cap */}
      <path
        d="M20 28 L24 32 L28 30 L30 34 L32 30 L36 32 L40 26 L38 24 L32 28 L30 26 L28 28 L22 24 Z"
        fill="hsl(0 0% 98%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Snow particles */}
      <circle cx="14" cy="14" r="2" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="1.5" />
      <circle cx="30" cy="10" r="2.5" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="1.5" />
      <circle cx="46" cy="16" r="2" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="1.5" />
      <circle cx="22" cy="20" r="1.5" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="1" />
      <circle cx="42" cy="12" r="1.5" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="1" />
    </svg>
  );
}

// Frosty - mountain with ice formations
export function FrostSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Frozen mountain */}
      <path
        d="M6 46 L22 28 L30 34 L38 26 L54 46 Z"
        fill={primaryColor}
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Ice crystal patterns on mountain */}
      <path d="M22 28 L26 36" stroke="hsl(0 0% 95%)" strokeWidth="2" strokeLinecap="round" />
      <path d="M38 26 L34 36" stroke="hsl(0 0% 95%)" strokeWidth="2" strokeLinecap="round" />
      <path d="M30 34 L30 42" stroke="hsl(0 0% 95%)" strokeWidth="2" strokeLinecap="round" />
      {/* Icicle formations at top */}
      <path
        d="M16 16 L18 8 L20 16 L22 6 L24 16 L26 10 L28 16"
        fill="none"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 16 L34 10 L36 16 L38 6 L40 16 L42 8 L44 16"
        fill="none"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Rain runner - mountain with rain streaks
export function RainSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Mountain in mist */}
      <path
        d="M4 46 L18 32 L28 38 L38 28 L48 34 L56 46 Z"
        fill="hsl(0 0% 75%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Rain streaks */}
      <line x1="12" y1="6" x2="10" y2="20" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="22" y1="4" x2="20" y2="18" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="6" x2="30" y2="20" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42" y1="4" x2="40" y2="18" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="52" y1="6" x2="50" y2="20" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      {/* Puddle/water at base */}
      <ellipse cx="30" cy="46" rx="20" ry="3" fill={primaryColor} opacity="0.5" />
    </svg>
  );
}
