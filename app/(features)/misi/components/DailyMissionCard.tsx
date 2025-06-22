import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type DailyMission = {
  badge_reward?: string;
  id: string;
  name: string;
  description: string | null;
  level: number;
  level_requirement: number;
  xp_reward: number;
  points_reward: number;
  reset_time?: string;
  created_at?: string;
  updated_at?: string;
  badge?: string; // Menambahkan properti badge
};

type DailyMissionProgress = {
  id: string;
  user_id: string;
  daily_mission_id: string;
  mission_id: string;
  progress_point: number;
  current_level_requirement: number;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
};

interface DailyMissionCardProps {
  mission: DailyMission;
  progress?: DailyMissionProgress;
  onClaim: (mission: DailyMission) => void;
}

export function DailyMissionCard({
  mission,
  progress,
  onClaim,
}: DailyMissionCardProps) {
  const progressPoint = progress?.progress_point || 0;
  const progressLimit = mission.level_requirement || 1;
  const isCompleted = progress?.completed_at !== null;
  const canClaim = progressPoint >= progressLimit && !isCompleted;

  // Determine badge image based on exact mission name
  let badgeImage = "/images/mission.svg";

  if (mission.name === "Login Streak!") {
    badgeImage = "/images/Login Streak.png";
  } else if (mission.name === "Dictionary Diver!") {
    badgeImage = "/images/Dictionary Diver.png";
  } else if (mission.name === "Lucky draw") {
    badgeImage = "/images/Lucky Spin.png";
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 flex items-center justify-center ${mission.name === "Login Streak!" ? "bg-orange-100" : "bg-green-100"} rounded-lg overflow-hidden`}
        >
          <Image
            src={badgeImage}
            alt={mission.name}
            width={80}
            height={80}
            className="object-contain w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium">{mission.name}</h3>
          <p className="sm:text-xs text-sm text-gray-500">
            {mission.description}
          </p>
          <div className="mt-2">
            <div className="text-sm text-gray-600 pb-2">Daily Mission</div>
            {!canClaim ? (
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`bg-yellow-500 h-4 rounded-full`}
                    style={{
                      width: `${Math.min((progressPoint / progressLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="text-sm text-gray-600 w-10 ml-2">
                  {progressPoint} / {progressLimit}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onClaim(mission)}
                  className={`bg-yellow-500 hover:bg-yellow-600 flex-1`}
                >
                  Klaim Hadiah
                </Button>
                <div className="text-sm text-gray-600">
                  {progressPoint} / {progressLimit}
                </div>
              </div>
            )}
            {isCompleted && (
              <div className="mt-2 text-sm text-green-600">
                Misi selesai! Kembali lagi besok
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
