import { SVGProps } from 'react';

interface SymbolProps extends SVGProps<SVGSVGElement> {
  primaryColor?: string;
  secondaryColor?: string;
}

// Single mountain peak - first_run
export function MountainSingle({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      <path
        d="M30 8L52 42H8L30 8Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Snow cap */}
      <path
        d="M30 8L38 20H22L30 8Z"
        fill="white"
        stroke="hsl(0 0% 20%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Mountain with "5" badge
export function MountainFive({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      <path
        d="M30 12L48 42H12L30 12Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text
        x="30"
        y="36"
        textAnchor="middle"
        fill="white"
        stroke="hsl(0 0% 20%)"
        strokeWidth="0.5"
        fontSize="14"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        5
      </text>
    </svg>
  );
}

// Mountain with "10" badge
export function MountainTen({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      <path
        d="M30 10L50 42H10L30 10Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text
        x="30"
        y="36"
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

// Double peak with "25"
export function MountainTwentyFive({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Back mountain */}
      <path
        d="M40 14L54 42H26L40 14Z"
        fill="hsl(45 70% 40%)"
        stroke="hsl(0 0% 20%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Front mountain */}
      <path
        d="M24 18L42 42H6L24 18Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text
        x="28"
        y="36"
        textAnchor="middle"
        fill="white"
        stroke="hsl(0 0% 20%)"
        strokeWidth="0.5"
        fontSize="11"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        25
      </text>
    </svg>
  );
}

// Mountain range with "50"
export function MountainFifty({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Far mountain */}
      <path
        d="M48 18L58 42H38L48 18Z"
        fill="hsl(45 60% 35%)"
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Mid mountain */}
      <path
        d="M38 14L52 42H24L38 14Z"
        fill="hsl(45 70% 42%)"
        stroke="hsl(0 0% 20%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Main mountain */}
      <path
        d="M22 12L40 42H4L22 12Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text
        x="24"
        y="36"
        textAnchor="middle"
        fill="white"
        stroke="hsl(0 0% 20%)"
        strokeWidth="0.5"
        fontSize="11"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        50
      </text>
    </svg>
  );
}

// Epic mountain with star and "100"
export function MountainHundred({ primaryColor = 'currentColor', secondaryColor = 'hsl(280 68% 60%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 55" fill="none" {...props}>
      {/* Star above peak */}
      <path
        d="M30 4L32 10L38 10L33 14L35 20L30 16L25 20L27 14L22 10L28 10L30 4Z"
        fill={secondaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Mountain */}
      <path
        d="M30 18L52 48H8L30 18Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text
        x="30"
        y="42"
        textAnchor="middle"
        fill="white"
        stroke="hsl(0 0% 20%)"
        strokeWidth="0.5"
        fontSize="10"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        100
      </text>
    </svg>
  );
}

// Paths/network symbol for all_segments
export function PathsSymbol({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Mountain outline */}
      <path
        d="M30 8L52 42H8L30 8Z"
        fill="hsl(0 0% 95%)"
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Path lines */}
      <path
        d="M30 8L30 42"
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30 20L18 42"
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30 20L42 42"
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Junction points */}
      <circle cx="30" cy="20" r="3" fill={primaryColor} stroke="hsl(0 0% 20%)" strokeWidth="1.5" />
      <circle cx="30" cy="8" r="2.5" fill={primaryColor} stroke="hsl(0 0% 20%)" strokeWidth="1.5" />
    </svg>
  );
}
