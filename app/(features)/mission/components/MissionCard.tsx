import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type Mission = {
  id: string;
  name: string;
  description: string | null;
  level: number;
  level_requirement: number;
  xp_reward: number;
  points_reward: number;
};

type MissionProgress = {
  id: string;
  userId: string;
  mission_id: string;
  progress_point: number;
  current_level: number;
  current_level_requirement: number;
  last_completed_at: string | null;
};

interface MissionCardProps {
  mission: Mission;
  progress?: MissionProgress;
  onClaim: (mission: Mission) => void;
}

export function MissionCard({ mission, progress, onClaim }: MissionCardProps) {
  const progressPoint = progress?.progress_point || 0;
  const progressLevel = progress?.current_level || 0;
  const progressLimit = progress?.current_level_requirement || 0;
  const canClaim = progressPoint >= mission.level_requirement;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 md:w-32 md:h-32 flex items-center justify-center bg-green-100 rounded-lg">
          <div className="text-2xl md:text-4xl">🎯</div>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium">{mission.name}</h3>
          <p className="text-sm text-gray-500">{mission.description}</p>
          <div className="mt-2">
            <div className="text-sm text-gray-600 pb-2">
              Level {progressLevel || 1}
            </div>
            {!canClaim ? (
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-yellow-500 h-4 rounded-full"
                    style={{
                      width: `${(progressPoint / progressLimit) * 100}%`,
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
                  className="bg-yellow-500 hover:bg-yellow-600 flex-1"
                >
                  Klaim Hadiah
                </Button>
                <div className="text-sm text-gray-600">
                  {progressPoint} / {progressLimit}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
