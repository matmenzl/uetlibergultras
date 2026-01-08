import { SVGProps } from 'react';

interface SymbolProps extends SVGProps<SVGSVGElement> {
  primaryColor?: string;
  secondaryColor?: string;
}

// Double flame for streak_2
export function FlameDouble({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Left flame */}
      <path
        d="M22 42C22 42 16 34 16 28C16 22 20 18 22 14C24 18 28 22 28 28C28 34 22 42 22 42Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Right flame */}
      <path
        d="M38 42C38 42 32 34 32 28C32 22 36 18 38 14C40 18 44 22 44 28C44 34 38 42 38 42Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Inner glow left */}
      <path
        d="M22 38C22 38 19 33 19 29C19 25 21 22 22 20C23 22 25 25 25 29C25 33 22 38 22 38Z"
        fill="hsl(45 93% 60%)"
      />
      {/* Inner glow right */}
      <path
        d="M38 38C38 38 35 33 35 29C35 25 37 22 38 20C39 22 41 25 41 29C41 33 38 38 38 38Z"
        fill="hsl(45 93% 60%)"
      />
    </svg>
  );
}

// Quad flame for streak_4
export function FlameQuad({ primaryColor = 'currentColor', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 50" fill="none" {...props}>
      {/* Four flames in a row with number */}
      <path
        d="M12 42C12 42 8 36 8 32C8 28 11 25 12 22C13 25 16 28 16 32C16 36 12 42 12 42Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M24 42C24 42 20 36 20 32C20 28 23 25 24 22C25 25 28 28 28 32C28 36 24 42 24 42Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M36 42C36 42 32 36 32 32C32 28 35 25 36 22C37 25 40 28 40 32C40 36 36 42 36 42Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M48 42C48 42 44 36 44 32C44 28 47 25 48 22C49 25 52 28 52 32C52 36 48 42 48 42Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Number badge */}
      <circle cx="30" cy="12" r="8" fill="white" stroke="hsl(0 0% 20%)" strokeWidth="2" />
      <text
        x="30"
        y="16"
        textAnchor="middle"
        fill="hsl(0 0% 20%)"
        fontSize="10"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        4
      </text>
    </svg>
  );
}

// Eight flames (stylized) for streak_8
export function FlameEight({ primaryColor = 'currentColor', secondaryColor = 'hsl(45 93% 47%)', ...props }: SymbolProps) {
  return (
    <svg viewBox="0 0 60 55" fill="none" {...props}>
      {/* Central large flame */}
      <path
        d="M30 48C30 48 20 36 20 26C20 18 26 12 30 6C34 12 40 18 40 26C40 36 30 48 30 48Z"
        fill={primaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner flame */}
      <path
        d="M30 44C30 44 24 36 24 28C24 22 27 18 30 14C33 18 36 22 36 28C36 36 30 44 30 44Z"
        fill={secondaryColor}
        stroke="hsl(0 0% 20%)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Core */}
      <path
        d="M30 40C30 40 27 35 27 30C27 26 29 24 30 22C31 24 33 26 33 30C33 35 30 40 30 40Z"
        fill="white"
      />
      {/* Number badge */}
      <circle cx="48" cy="12" r="7" fill="white" stroke="hsl(0 0% 20%)" strokeWidth="2" />
      <text
        x="48"
        y="16"
        textAnchor="middle"
        fill="hsl(0 0% 20%)"
        fontSize="9"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        8
      </text>
    </svg>
  );
}
