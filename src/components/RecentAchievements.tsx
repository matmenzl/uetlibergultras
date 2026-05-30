import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Sparkles, User, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getBadgeById } from '@/config/badge-definitions';
import type { User as AuthUser } from '@supabase/supabase-js';

interface RecentAchievement {
  id: string;
  user_id: string;
  achievement: string;
  earned_at: string;
  display_name: string | null;
  profile_picture: string | null;
}

const MAX_ITEMS = 12;

export const RecentAchievements = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const { data: items, isLoading } = useQuery({
    queryKey: ['recent-achievements', !!user],
    enabled: !!user,
    queryFn: async (): Promise<RecentAchievement[]> => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: achievements, error } = await supabase
        .from('user_achievements')
        .select('id, user_id, achievement, earned_at')
        .gte('earned_at', sevenDaysAgo)
        .order('earned_at', { ascending: false })
        .limit(MAX_ITEMS);

      if (error) throw error;
      if (!achievements || achievements.length === 0) return [];

      const userIds = Array.from(new Set(achievements.map((a) => a.user_id)));
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, display_name, profile_picture')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, { display_name: p.display_name, profile_picture: p.profile_picture }])
      );

      return achievements.map((a) => ({
        id: a.id,
        user_id: a.user_id,
        achievement: a.achievement,
        earned_at: a.earned_at,
        display_name: profileMap.get(a.user_id)?.display_name ?? 'Unbekannt',
        profile_picture: profileMap.get(a.user_id)?.profile_picture ?? null,
      }));
    },
  });

  const header = (
    <div className="flex items-center gap-2 mb-4">
      <Sparkles className="w-5 h-5 text-primary" />
      <h3 className="font-bold text-lg">Neueste Achievements</h3>
      <span className="text-xs text-muted-foreground ml-auto">letzte 7 Tage</span>
    </div>
  );

  if (!user) {
    return (
      <Card className="p-6">
        {header}
        <div className="text-center py-6">
          <Lock className="w-8 h-8 text-primary/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">
            Melde dich an, um zu sehen welche Achievements die Community in den letzten 7 Tagen geholt hat.
          </p>
          <Button onClick={() => navigate('/auth')} size="sm">
            Jetzt mitmachen
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        {header}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-md" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card className="p-6">
        {header}
        <div className="text-center py-6">
          <Sparkles className="w-10 h-10 text-primary/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            In den letzten 7 Tagen wurden noch keine Achievements geholt. Sei der Erste!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {header}
      <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {items.map((item) => {
          const badge = getBadgeById(item.achievement);
          const title = badge?.title ?? item.achievement;
          const description = badge?.description ?? '';
          return (
            <li key={item.id}>
              <Link
                to={`/runner/${item.user_id}`}
                className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-muted/50"
              >
                <div className="relative w-11 h-11 shrink-0 rounded-md bg-muted/40 flex items-center justify-center overflow-hidden">
                  {badge?.imageUrl ? (
                    <img
                      src={badge.imageUrl}
                      alt={title}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <Sparkles className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium truncate max-w-[120px]">
                      {item.display_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(item.earned_at), { addSuffix: true, locale: de })}
                    </p>
                  </div>
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={item.profile_picture || undefined} />
                    <AvatarFallback>
                      <User className="w-3.5 h-3.5" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </Link>
              <div className="sm:hidden pl-14 -mt-1 mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="truncate font-medium text-foreground/80">{item.display_name}</span>
                <span>·</span>
                <span>{formatDistanceToNow(new Date(item.earned_at), { addSuffix: true, locale: de })}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};