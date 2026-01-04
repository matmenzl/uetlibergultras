import { Mountain } from 'lucide-react';
import logo from '@/assets/uetlibergultras_logo.svg';

interface PassHeaderProps {
  displayName?: string;
  earnedCount: number;
  totalCount: number;
}

export function PassHeader({ displayName, earnedCount, totalCount }: PassHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center mb-8">
      {/* Logo */}
      <img 
        src={logo} 
        alt="Uetliberg Ultras" 
        className="h-12 w-auto mb-2 opacity-90"
      />
      
      {/* Title */}
      <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
        <Mountain className="w-5 h-5 text-primary" />
        Uetliberg Pass
      </h2>
      
      {/* User name */}
      {displayName && (
        <p className="text-sm text-muted-foreground mt-1">
          {displayName}
        </p>
      )}
      
      {/* Progress */}
      <div className="mt-3 px-4 py-1.5 bg-primary/10 rounded-full">
        <p className="text-sm font-medium text-primary">
          {earnedCount} von {totalCount} Stempel
        </p>
      </div>
    </div>
  );
}
