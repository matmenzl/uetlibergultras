import { SVGProps } from 'react';

interface SymbolProps extends SVGProps<SVGSVGElement> {
  primaryColor?: string;
  secondaryColor?: string;
}

// Founding member - mountain with "F" carved in rock
export function StarFoundingSymbol({ primaryColor = 'currentColor', secondaryColor = 'hsl(45 93% 47%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 55" fill="none" {...props}>
      {/* Banner ribbon */}
      <path
        d="M6 8 L54 8 L52 14 L54 20 L6 20 L8 14 Z"
        fill={secondaryColor}
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
      />
      <text x="30" y="17" textAnchor="middle" fill="hsl(0 0% 15%)" fontSize="8" fontWeight="bold" fontFamily="system-ui">GRÜNDER</text>
      {/* Mountain with monolith */}
      <path
        d="M6 50 L22 34 L32 40 L42 32 L56 50 Z"
        fill={primaryColor}
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Monolith/marker stone */}
      <rect x="26" y="24" width="8" height="16" fill="hsl(0 0% 80%)" stroke="hsl(0 0% 15%)" strokeWidth="2" />
      <text x="30" y="36" textAnchor="middle" fill="hsl(0 0% 15%)" fontSize="10" fontWeight="bold" fontFamily="system-ui">F</text>
    </svg>
  );
}

// Pioneer 10 - mountain summit with flag
export function TrophyTenSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Mountain */}
      <path
        d="M4 46 L24 26 L34 32 L44 24 L56 46 Z"
        fill={primaryColor}
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Flag pole */}
      <line x1="24" y1="26" x2="24" y2="8" stroke="hsl(0 0% 15%)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Flag */}
      <path
        d="M24 8 L40 14 L24 20 Z"
        fill="hsl(0 0% 95%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text x="32" y="17" textAnchor="middle" fill="hsl(0 0% 15%)" fontSize="7" fontWeight="bold" fontFamily="system-ui">10</text>
    </svg>
  );
}

// Pioneer 25 - summit with larger flag
export function TrophyTwentyFiveSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Double mountain */}
      <path
        d="M0 46 L16 32 L26 38 L36 28 L46 34 L60 46 Z"
        fill="hsl(142 50% 35%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M6 46 L22 30 L32 36 L40 28 L54 46 Z"
        fill={primaryColor}
        stroke="hsl(0 0% 15%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Flag */}
      <line x1="22" y1="30" x2="22" y2="8" stroke="hsl(0 0% 15%)" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M22 8 L42 14 L22 22 Z"
        fill="hsl(0 0% 95%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text x="32" y="18" textAnchor="middle" fill="hsl(0 0% 15%)" fontSize="8" fontWeight="bold" fontFamily="system-ui">25</text>
    </svg>
  );
}

// Pioneer 50 - summit with pennant
export function TrophyFiftySymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Triple layered mountains */}
      <path d="M0 48 L14 34 L24 40 L34 30 L44 36 L60 48 Z" fill="hsl(142 40% 28%)" stroke="hsl(0 0% 15%)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 48 L18 32 L28 38 L38 28 L50 48 Z" fill="hsl(142 50% 36%)" stroke="hsl(0 0% 15%)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 48 L24 30 L34 36 L46 48 Z" fill={primaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Tall pennant */}
      <line x1="24" y1="30" x2="24" y2="4" stroke="hsl(0 0% 15%)" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M24 4 L44 10 L24 18 Z"
        fill="hsl(0 0% 95%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text x="34" y="14" textAnchor="middle" fill="hsl(0 0% 15%)" fontSize="8" fontWeight="bold" fontFamily="system-ui">50</text>
    </svg>
  );
}
