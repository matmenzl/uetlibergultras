import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface FoundingMemberBadgeProps {
  userNumber?: number | null;
  showNumber?: boolean;
  size?: 'sm' | 'md';
}

export function FoundingMemberBadge({ 
  userNumber, 
  showNumber = false,
  size = 'sm' 
}: FoundingMemberBadgeProps) {
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-3 py-1';

  return (
    <Badge 
      className={`bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 border-0 ${sizeClasses} font-semibold gap-1 animate-pulse`}
    >
      <Sparkles className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {showNumber && userNumber ? `#${userNumber} ` : ''}Founding Member
    </Badge>
  );
}
