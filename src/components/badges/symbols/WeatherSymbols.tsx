import { SVGProps } from 'react';

interface SymbolProps extends SVGProps<SVGSVGElement> {
  primaryColor?: string;
  secondaryColor?: string;
}

// Sunrise for early_bird
export function SunriseSymbol({ primaryColor = 'currentColor', secondaryColor = 'hsl(199 89% 48%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Mountain silhouette */}
      <path
        d="M0 42L20 24L30 32L45 18L60 42H0Z"
        fill="hsl(0 0% 25%)"
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
      />
      {/* Sun */}
      <circle
        cx="30"
        cy="20"
        r="10"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2"
      />
      {/* Sun rays */}
      <line x1="30" y1="4" x2="30" y2="8" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="44" y1="20" x2="48" y2="20" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="20" x2="12" y2="20" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="10" x2="43" y2="7" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="10" x2="17" y2="7" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// Moon for night_owl
export function MoonSymbol({ primaryColor = 'currentColor', secondaryColor = 'hsl(45 93% 70%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Mountain silhouette */}
      <path
        d="M0 46L18 28L28 36L42 22L60 46H0Z"
        fill="hsl(230 25% 20%)"
        stroke="hsl(0 0% 15%)"
        strokeWidth="1.5"
      />
      {/* Moon crescent */}
      <path
        d="M38 8C38 16.837 30.837 24 22 24C18.5 24 15.3 22.9 12.6 21C15.4 25.8 20.8 29 27 29C36.389 29 44 21.389 44 12C44 8.2 42.7 4.7 40.5 2C39.5 3.8 38.5 5.8 38 8Z"
        fill={secondaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2"
      />
      {/* Stars */}
      <circle cx="50" cy="12" r="1.5" fill={secondaryColor} />
      <circle cx="14" cy="8" r="1" fill={secondaryColor} />
      <circle cx="8" cy="18" r="1.5" fill={secondaryColor} />
    </svg>
  );
}

// Snowflake for snow_bunny
export function SnowflakeSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Main axes */}
      <line x1="30" y1="5" x2="30" y2="45" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" />
      <line x1="10" y1="25" x2="50" y2="25" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" />
      <line x1="15" y1="10" x2="45" y2="40" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" />
      <line x1="45" y1="10" x2="15" y2="40" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" />
      
      {/* Branch details */}
      <line x1="30" y1="12" x2="25" y2="8" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="12" x2="35" y2="8" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="38" x2="25" y2="42" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="38" x2="35" y2="42" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      
      <line x1="17" y1="25" x2="14" y2="20" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="17" y1="25" x2="14" y2="30" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="43" y1="25" x2="46" y2="20" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="43" y1="25" x2="46" y2="30" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      
      {/* Center */}
      <circle cx="30" cy="25" r="4" fill={primaryColor} stroke="hsl(0 0% 20%)" strokeWidth="1.5" />
    </svg>
  );
}

// Frost/icicle for frosty
export function FrostSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Icicles */}
      <path
        d="M10 8L10 28L14 8L14 32L18 8L18 26L22 8L22 34L26 8L26 28L30 8L30 38L34 8L34 28L38 8L38 34L42 8L42 26L46 8L46 32L50 8L50 28"
        stroke={primaryColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Ice bar at top */}
      <rect x="6" y="4" width="48" height="6" rx="2" fill={primaryColor} stroke="hsl(0 0% 20%)" strokeWidth="1.5" />
      {/* Snowflakes */}
      <circle cx="15" cy="42" r="2" fill={primaryColor} />
      <circle cx="30" cy="44" r="2.5" fill={primaryColor} />
      <circle cx="45" cy="42" r="2" fill={primaryColor} />
    </svg>
  );
}

// Rain drops for wasserratte
export function RainSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Cloud */}
      <path
        d="M14 22C14 18 17 14 22 14C22 10 26 6 32 6C38 6 42 10 42 14H44C48 14 52 18 52 22C52 26 48 28 44 28H16C12 28 10 25 10 22C10 19 12 16 14 16"
        fill="hsl(0 0% 85%)"
        stroke="hsl(0 0% 20%)"
        strokeWidth="2"
      />
      {/* Rain drops */}
      <path
        d="M18 34L16 42C16 44 18 46 20 44L22 36"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
      />
      <path
        d="M30 32L28 44C28 46 30 48 32 46L34 34"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
      />
      <path
        d="M42 34L40 42C40 44 42 46 44 44L46 36"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
