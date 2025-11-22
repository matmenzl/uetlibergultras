import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LeaderboardType } from "@/types/leaderboard";

interface LeaderboardTabsProps {
  activeTab: LeaderboardType;
  onTabChange: (tab: LeaderboardType) => void;
  children: React.ReactNode;
}

export const LeaderboardTabs = ({ activeTab, onTabChange, children }: LeaderboardTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as LeaderboardType)}>
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="most-efforts-overall" className="text-sm">
          Meiste Efforts
        </TabsTrigger>
        <TabsTrigger value="most-efforts-monthly" className="text-sm">
          Diesen Monat
        </TabsTrigger>
        <TabsTrigger value="most-unique-segments" className="text-sm">
          Meiste Segmente
        </TabsTrigger>
      </TabsList>

      <TabsContent value="most-efforts-overall" className="mt-0">
        {children}
      </TabsContent>
      <TabsContent value="most-efforts-monthly" className="mt-0">
        {children}
      </TabsContent>
      <TabsContent value="most-unique-segments" className="mt-0">
        {children}
      </TabsContent>
    </Tabs>
  );
};
