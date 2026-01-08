import { SVGProps } from 'react';

interface SymbolProps extends SVGProps<SVGSVGElement> {
  primaryColor?: string;
  secondaryColor?: string;
}

// 2 week streak - two connected ascent paths
export function FlameDouble({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Mountain silhouette */}
      <path
        d="M4 46 L20 32 L30 38 L40 30 L56 46 Z"
        fill="hsl(0 0% 85%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Two ascending paths */}
      <path
        d="M10 46 Q16 40 22 34 Q26 30 30 26"
        fill="none"
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M20 46 Q28 38 34 32 Q40 28 46 24"
        fill="none"
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Summit markers */}
      <circle cx="30" cy="24" r="3" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2" />
      <circle cx="46" cy="22" r="3" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2" />
      {/* Number */}
      <text x="12" y="18" textAnchor="middle" fill="hsl(0 0% 15%)" fontSize="10" fontWeight="bold" fontFamily="system-ui">2</text>
    </svg>
  );
}

// 4 week streak - four parallel ascent lines
export function FlameQuad({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Mountain */}
      <path
        d="M6 46 L30 18 L54 46 Z"
        fill="hsl(0 0% 88%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Four ascent lines */}
      <line x1="14" y1="46" x2="24" y2="28" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" />
      <line x1="22" y1="46" x2="28" y2="26" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="46" x2="32" y2="26" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" />
      <line x1="46" y1="46" x2="36" y2="28" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" />
      {/* Summit */}
      <circle cx="30" cy="16" r="4" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2" />
      {/* Number */}
      <text x="30" y="19" textAnchor="middle" fill="hsl(0 0% 95%)" fontSize="6" fontWeight="bold" fontFamily="system-ui">4</text>
    </svg>
  );
}

// 8 week streak - mountain with radiating paths
export function FlameEight({ primaryColor = 'currentColor', secondaryColor = 'hsl(45 93% 47%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 55" fill="none" {...props}>
      {/* Base mountain */}
      <path
        d="M4 50 L30 16 L56 50 Z"
        fill="hsl(0 0% 85%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Radiating paths from summit */}
      <line x1="30" y1="16" x2="10" y2="50" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="30" y1="16" x2="18" y2="50" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="30" y1="16" x2="26" y2="50" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="30" y1="16" x2="34" y2="50" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="30" y1="16" x2="42" y2="50" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="30" y1="16" x2="50" y2="50" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      {/* Summit emblem */}
      <circle cx="30" cy="14" r="6" fill={secondaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2" />
      <text x="30" y="17" textAnchor="middle" fill="hsl(0 0% 15%)" fontSize="7" fontWeight="bold" fontFamily="system-ui">8</text>
    </svg>
  );
}
