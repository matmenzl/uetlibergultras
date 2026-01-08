// Mountain symbols
export { 
  MountainSingle, 
  MountainFive, 
  MountainTen, 
  MountainTwentyFive, 
  MountainFifty, 
  MountainHundred,
  PathsSymbol 
} from './MountainSymbols';

// Flame/streak symbols
export { FlameDouble, FlameQuad, FlameEight } from './FlameSymbols';

// Weather symbols
export { SunriseSymbol, MoonSymbol, SnowflakeSymbol, FrostSymbol, RainSymbol } from './WeatherSymbols';

// Community symbols
export { StarFoundingSymbol, TrophyTenSymbol, TrophyTwentyFiveSymbol, TrophyFiftySymbol } from './CommunitySymbols';

// Legend symbols
export { CrownSymbol, CompassSymbol } from './LegendSymbols';

// Symbol mapping for badge definitions
import { ComponentType, SVGProps } from 'react';
import { 
  MountainSingle, MountainFive, MountainTen, MountainTwentyFive, 
  MountainFifty, MountainHundred, PathsSymbol 
} from './MountainSymbols';
import { FlameDouble, FlameQuad, FlameEight } from './FlameSymbols';
import { SunriseSymbol, MoonSymbol, SnowflakeSymbol, FrostSymbol, RainSymbol } from './WeatherSymbols';
import { StarFoundingSymbol, TrophyTenSymbol, TrophyTwentyFiveSymbol, TrophyFiftySymbol } from './CommunitySymbols';
import { CrownSymbol, CompassSymbol } from './LegendSymbols';

interface SymbolProps extends SVGProps<SVGSVGElement> {
  primaryColor?: string;
  secondaryColor?: string;
}

export const symbolMap: Record<string, ComponentType<SymbolProps>> = {
  // Milestone
  'mountain-single': MountainSingle,
  'mountain-five': MountainFive,
  'mountain-ten': MountainTen,
  'mountain-twentyfive': MountainTwentyFive,
  'mountain-fifty': MountainFifty,
  'mountain-hundred': MountainHundred,
  'paths': PathsSymbol,
  
  // Endurance
  'flame-double': FlameDouble,
  'flame-quad': FlameQuad,
  'flame-eight': FlameEight,
  
  // Weather
  'sunrise': SunriseSymbol,
  'moon': MoonSymbol,
  'snowflake': SnowflakeSymbol,
  'frost': FrostSymbol,
  'rain': RainSymbol,
  
  // Community
  'star-founding': StarFoundingSymbol,
  'trophy-ten': TrophyTenSymbol,
  'trophy-twentyfive': TrophyTwentyFiveSymbol,
  'trophy-fifty': TrophyFiftySymbol,
  
  // Legend
  'crown': CrownSymbol,
  'compass': CompassSymbol,
};

export function getSymbol(symbolId: string): ComponentType<SymbolProps> | null {
  return symbolMap[symbolId] || null;
}
