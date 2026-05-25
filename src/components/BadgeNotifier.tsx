import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { badgeDefinitions } from "@/config/badge-definitions";

const STORAGE_PREFIX = "uu:seen_achievements:";

function loadSeen(userId: string): Set<string> | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeen(userId: string, seen: Set<string>) {
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(Array.from(seen)));
  } catch {
    // ignore quota errors
  }
}

function fireBadgeToast(achievementId: string, navigate: (to: string) => void) {
  const def = badgeDefinitions.find((b) => b.id === achievementId);
  const title = def ? `🏅 ${def.title}` : "🏅 Neues Badge freigeschaltet!";
  const description = def?.description ?? "Schau dir dein neues Badge im Pass an.";
  toast.success(title, {
    description,
    duration: 8000,
    action: {
      label: "Anschauen",
      onClick: () => navigate("/pass"),
    },
  });
}

export default function BadgeNotifier() {
  const navigate = useNavigate();
  const currentUserId = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    const setup = async (userId: string) => {
      currentUserId.current = userId;

      const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement")
        .eq("user_id", userId);

      if (cancelled || error || !data) return;

      const currentIds = data.map((row) => row.achievement as string);
      const prevSeen = loadSeen(userId);

      if (prevSeen === null) {
        // First time we see this user on this device — silently baseline.
        saveSeen(userId, new Set(currentIds));
      } else {
        const newOnes = currentIds.filter((id) => !prevSeen.has(id));
        newOnes.forEach((id, idx) => {
          setTimeout(() => fireBadgeToast(id, navigate), idx * 400);
        });
        const merged = new Set(prevSeen);
        currentIds.forEach((id) => merged.add(id));
        saveSeen(userId, merged);
      }

      // Realtime subscription for new inserts during the session.
      cleanup();
      const channel = supabase
        .channel(`badge-notifier:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_achievements",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const achievement = (payload.new as { achievement?: string })?.achievement;
            if (!achievement || currentUserId.current !== userId) return;
            const seen = loadSeen(userId) ?? new Set<string>();
            if (seen.has(achievement)) return;
            seen.add(achievement);
            saveSeen(userId, seen);
            fireBadgeToast(achievement, navigate);
          }
        )
        .subscribe();
      channelRef.current = channel;
    };

    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) setup(uid);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      if (uid && uid !== currentUserId.current) {
        setup(uid);
      } else if (!uid) {
        currentUserId.current = null;
        cleanup();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      cleanup();
    };
  }, [navigate]);

  return null;
}