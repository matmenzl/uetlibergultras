import { SVGProps } from 'react';
import { UetlibergHorizon } from './UetlibergBase';

interface SymbolProps extends SVGProps<SVGSVGElement> {
  primaryColor?: string;
  secondaryColor?: string;
}

// Gold Medal - mountain with golden trophy/star
export function MedalGoldSymbol({ primaryColor = 'currentColor', secondaryColor = 'hsl(45 93% 47%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      <UetlibergHorizon opacity={0.08} />
      {/* Mountain */}
      <path
        d="M6 46 L22 30 L30 34 L38 28 L54 46 Z"
        fill="hsl(45 50% 30%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Medal circle */}
      <circle cx="30" cy="16" r="10" fill={secondaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2.5" />
      <circle cx="30" cy="16" r="7" fill="none" stroke="hsl(45 93% 65%)" strokeWidth="1.5" />
      {/* Star in medal */}
      <path
        d="M30 10 L31.5 13.5 L35 14 L32.5 16.5 L33 20 L30 18.5 L27 20 L27.5 16.5 L25 14 L28.5 13.5 Z"
        fill="hsl(0 0% 15%)"
      />
      {/* Ribbon */}
      <path d="M22 10 L26 20" stroke={secondaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 10 L34 20" stroke={secondaryColor} strokeWidth="2.5" strokeLinecap="round" />
      {/* Number 1 */}
      <text x="30" y="42" textAnchor="middle" fill="hsl(0 0% 95%)" fontSize="8" fontWeight="bold" fontFamily="system-ui">1</text>
    </svg>
  );
}

// Silver Medal
export function MedalSilverSymbol({ primaryColor = 'currentColor', secondaryColor = 'hsl(0 0% 70%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      <UetlibergHorizon opacity={0.08} />
      {/* Mountain */}
      <path
        d="M6 46 L22 30 L30 34 L38 28 L54 46 Z"
        fill="hsl(0 0% 40%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Medal circle */}
      <circle cx="30" cy="16" r="10" fill={secondaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2.5" />
      <circle cx="30" cy="16" r="7" fill="none" stroke="hsl(0 0% 85%)" strokeWidth="1.5" />
      {/* Star in medal */}
      <path
        d="M30 10 L31.5 13.5 L35 14 L32.5 16.5 L33 20 L30 18.5 L27 20 L27.5 16.5 L25 14 L28.5 13.5 Z"
        fill="hsl(0 0% 15%)"
      />
      {/* Ribbon */}
      <path d="M22 10 L26 20" stroke={secondaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 10 L34 20" stroke={secondaryColor} strokeWidth="2.5" strokeLinecap="round" />
      {/* Number 2 */}
      <text x="30" y="42" textAnchor="middle" fill="hsl(0 0% 95%)" fontSize="8" fontWeight="bold" fontFamily="system-ui">2</text>
    </svg>
  );
}

// Bronze Medal
export function MedalBronzeSymbol({ primaryColor = 'currentColor', secondaryColor = 'hsl(25 70% 45%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      <UetlibergHorizon opacity={0.08} />
      {/* Mountain */}
      <path
        d="M6 46 L22 30 L30 34 L38 28 L54 46 Z"
        fill="hsl(25 40% 30%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Medal circle */}
      <circle cx="30" cy="16" r="10" fill={secondaryColor} stroke="hsl(0 0% 15%)" strokeWidth="2.5" />
      <circle cx="30" cy="16" r="7" fill="none" stroke="hsl(25 70% 60%)" strokeWidth="1.5" />
      {/* Star in medal */}
      <path
        d="M30 10 L31.5 13.5 L35 14 L32.5 16.5 L33 20 L30 18.5 L27 20 L27.5 16.5 L25 14 L28.5 13.5 Z"
        fill="hsl(0 0% 15%)"
      />
      {/* Ribbon */}
      <path d="M22 10 L26 20" stroke={secondaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 10 L34 20" stroke={secondaryColor} strokeWidth="2.5" strokeLinecap="round" />
      {/* Number 3 */}
      <text x="30" y="42" textAnchor="middle" fill="hsl(0 0% 95%)" fontSize="8" fontWeight="bold" fontFamily="system-ui">3</text>
    </svg>
  );
}
