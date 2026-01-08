import { cn } from '@/lib/utils';

interface BadgeShapeProps {
  className?: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  isEarned?: boolean;
  category?: 'milestone' | 'endurance' | 'weather' | 'community' | 'legend';
}

// Shield shape SVG with 5:7 aspect ratio matching the Uetliberg Ultras logo
export function BadgeShape({ 
  className,
  fillColor = 'currentColor',
  strokeColor = 'currentColor',
  strokeWidth = 3,
  isEarned = false,
  category = 'milestone'
}: BadgeShapeProps) {
  return (
    <svg
      viewBox="0 0 100 140"
      className={cn('w-full h-full', className)}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Shield path: rounded top, pointed bottom */}
      <path
        d="M8 8 
           L8 80 
           Q8 95 50 132 
           Q92 95 92 80 
           L92 8 
           Q92 4 88 4 
           L12 4 
           Q8 4 8 8 
           Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        className={cn(
          'transition-all duration-300',
          !isEarned && 'stroke-dasharray-[4,4]'
        )}
      />
    </svg>
  );
}

// Clip path for use in CSS (matches the SVG path proportionally)
export const badgeClipPath = 'polygon(0% 6%, 0% 57%, 50% 100%, 100% 57%, 100% 6%, 96% 0%, 4% 0%)';
