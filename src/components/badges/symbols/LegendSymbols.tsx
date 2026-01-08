import { SVGProps } from 'react';

interface SymbolProps extends SVGProps<SVGSVGElement> {
  primaryColor?: string;
  secondaryColor?: string;
}

// Denzlerweg/Coiffeur King - steep ridge with record marker
export function CrownSymbol({ primaryColor = 'currentColor', secondaryColor = 'hsl(45 93% 47%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 55" fill="none" {...props}>
      {/* Steep ridge profile */}
      <path
        d="M4 50 L4 46 L20 46 L44 14 L56 46 L56 50 Z"
        fill={primaryColor}
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Elevation grade lines */}
      <line x1="28" y1="38" x2="36" y2="30" stroke="hsl(0 0% 15%)" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="32" y1="42" x2="40" y2="34" stroke="hsl(0 0% 15%)" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="36" y1="46" x2="44" y2="38" stroke="hsl(0 0% 15%)" strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Record emblem at peak */}
      <circle cx="44" cy="12" r="8" fill={secondaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2.5" />
      <text x="44" y="15" textAnchor="middle" fill="hsl(0 0% 15%)" fontSize="8" fontWeight="bold" fontFamily="system-ui">1</text>
      {/* Ridge crest */}
      <path d="M20 46 L44 14" stroke="hsl(0 0% 95%)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Alternativliga - branching trails on mountain
export function CompassSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Mountain */}
      <path
        d="M4 46 L30 18 L56 46 Z"
        fill="hsl(0 0% 88%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Main trail */}
      <path
        d="M30 46 L30 26"
        fill="none"
        stroke="hsl(0 0% 50%)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Alternative branching trails */}
      <path
        d="M30 36 L18 46"
        fill="none"
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M30 36 L42 46"
        fill="none"
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M30 30 L14 42"
        fill="none"
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M30 30 L46 42"
        fill="none"
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Junction markers */}
      <circle cx="30" cy="36" r="3" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2" />
      <circle cx="30" cy="30" r="3" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2" />
      {/* Summit */}
      <circle cx="30" cy="18" r="4" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2.5" />
    </svg>
  );
}
