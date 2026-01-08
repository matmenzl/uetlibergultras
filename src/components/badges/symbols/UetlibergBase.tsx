import { SVGProps } from 'react';

interface UetlibergBaseProps extends SVGProps<SVGSVGElement> {
  variant?: 'horizon' | 'ridge' | 'silhouette';
  opacity?: number;
}

// Consistent Uetliberg ridge line that appears as subtle background in all badges
export function UetlibergHorizon({ opacity = 0.15 }: { opacity?: number }) {
  return (
    <path
      d="M0 46 L8 42 L14 44 L22 40 L30 38 L38 40 L46 42 L52 40 L60 44 L60 50 L0 50 Z"
      fill={`hsl(0 0% 20% / ${opacity})`}
      stroke="none"
    />
  );
}

// Characteristic Uetliberg profile with tower suggestion
export function UetlibergSilhouette({ opacity = 0.12 }: { opacity?: number }) {
  return (
    <g opacity={opacity}>
      {/* Distant ridge */}
      <path
        d="M0 48 L12 44 L24 46 L36 42 L48 44 L60 48 L60 50 L0 50 Z"
        fill="hsl(0 0% 15%)"
        stroke="none"
      />
      {/* Tower hint */}
      <rect x="35" y="40" width="2" height="4" fill="hsl(0 0% 15%)" />
    </g>
  );
}

// Sky gradient background
export function SkyGradient({ id = 'skyGradient' }: { id?: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="hsl(0 0% 95%)" stopOpacity="0.3" />
        <stop offset="100%" stopColor="hsl(0 0% 85%)" stopOpacity="0.1" />
      </linearGradient>
    </defs>
  );
}

// Combined base layer for badges - includes sky and horizon
export function BadgeBaseLandscape({ showSky = false }: { showSky?: boolean }) {
  return (
    <g className="badge-base-landscape">
      {showSky && (
        <>
          <SkyGradient id="badgeSky" />
          <rect x="0" y="0" width="60" height="50" fill="url(#badgeSky)" />
        </>
      )}
      <UetlibergHorizon opacity={0.12} />
    </g>
  );
}
