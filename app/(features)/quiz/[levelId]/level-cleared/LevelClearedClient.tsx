"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { useCallback } from "react";

interface Level {
  id: string;
  name: string;
  order: number;
}

interface UserStats {
  id: string;
  user_id: string;
  coins: number;
  xp: number;
}

export default function LevelClearedClient({ levelId }: { levelId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewardsGiven, setRewardsGiven] = useState(false);
  const [rewards, setRewards] = useState({ coins: 0, xp: 0 });

  // Calculate rewards based on level order
  const calculateRewards = useCallback((levelOrder: number) => {
    const baseCoins = 50;
    const baseXP = 100;
    const multiplier = levelOrder;
    return {
      coins: baseCoins * multiplier,
      xp: baseXP * multiplier,
    };
  }, []);

  // Function to update user stats
  const updateUserStats = useCallback(
    async (userId: string, levelOrder: number) => {
      try {
        // Calculate rewards
        const { coins, xp } = calculateRewards(levelOrder);

        // Get current user stats
        const { data: currentStats, error: statsError } = await supabase
          .from("users")
          .select("points, xp")
          .eq("id", userId)
          .single();

        if (statsError) throw statsError;

        // Update user stats with new values
        const { error: updateError } = await supabase
          .from("users")
          .update({
            points: (currentStats?.points || 0) + coins,
            xp: (currentStats?.xp || 0) + xp,
          })
          .eq("id", userId);

        if (updateError) throw updateError;

        setRewards({ coins, xp });
        setRewardsGiven(true);
      } catch (error) {
        console.error("Error updating user stats:", error);
      }
    },
    [supabase, calculateRewards]
  );

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Fetch level details
        const { data: levelData } = await supabase
          .from("quiz_level")
          .select("*")
          .eq("id", levelId)
          .single();

        if (levelData) {
          setLevel(levelData);

          // Only give rewards if they haven't been given yet
          if (!rewardsGiven) {
            await updateUserStats(user.id, levelData.order);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [levelId, supabase, router, updateUserStats, rewardsGiven]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        Loading...
      </div>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => router.push("/home")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold">Level {level?.name}</h1>
          <div className="w-8 h-8" /> {/* Spacer for alignment */}
        </div>

        {/* Content */}
        <div className="text-center space-y-6">
          <div className="p-6 bg-green-50 rounded-lg">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">
              Selamat! Level Selesai!
            </h2>
            <p className="text-muted-foreground">
              Kamu telah menyelesaikan semua soal dengan benar.
            </p>
          </div>

          {/* Rewards */}
          <div className="space-y-2">
            <h3 className="font-medium">Rewards yang kamu dapatkan:</h3>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">
                  {rewards.coins}
                </p>
                <p className="text-sm text-muted-foreground">Coins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{rewards.xp}</p>
                <p className="text-sm text-muted-foreground">XP</p>
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-green-500 hover:bg-green-600"
            onClick={() => router.push("/home")}
          >
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </main>
  );
}
