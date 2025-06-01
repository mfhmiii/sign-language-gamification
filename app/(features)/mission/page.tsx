"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import Image from "next/image";
import { useMission } from "./hooks/useMission";
import { MissionCard } from "./components/MissionCard";
import { DailyMissionCard } from "./components/DailyMissionCard";
import { RewardModal } from "./components/RewardModal";

// Import the types to use for type checking
import type { MissionProgress, DailyMissionProgress } from "./hooks/useMission";

export default function MissionPage() {
  const { missions, dailyMissions, userProgress, handleClaim } = useMission();
  const [showModal, setShowModal] = useState(false);
  const [currentReward, setCurrentReward] = useState<{
    item: any;
    scaledPoints?: number;
    scaledXP?: number;
  } | null>(null);

  const onMissionClaim = async (mission: any) => {
    const result = await handleClaim(mission);
    if (result) {
      setCurrentReward({
        item: mission,
        scaledPoints: result.scaledPoints,
        scaledXP: result.scaledXP,
      });
      setShowModal(true);
    }
  };

  return (
    <div className="pt-8 md:pt-10">
      <div className="flex flex-col">
        <div className="flex items-center justify-between md:justify-around px-4 md:px-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Ingin dapat Poin tambahan?
            </h2>
            <p className="text-lg md:text-xl font-semibold">
              mulai selesaikan misi!
            </p>
          </div>
          <Image
            src="/images/mission.svg"
            alt="Mascot"
            width={150}
            height={150}
            className="w-36 h-36 md:w-56 md:h-56"
          />
        </div>

        <div className="bg-white rounded-t-2xl pb-10 mx-0 sm:mx-10">
          <Tabs defaultValue="misi" className="w-full py-3">
            <TabsList className="w-full">
              <TabsTrigger value="daily" className="w-full">
                Misi Harian
              </TabsTrigger>
              <TabsTrigger value="misi" className="w-full">
                Misi
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
              <div className="grid gap-4 p-4">
                {dailyMissions.map((mission) => {
                  // Find the correct progress for this daily mission
                  const missionProgress = userProgress?.find(
                    (p) => "daily_mission_id" in p && p.daily_mission_id === mission.id
                  );
                  
                  return (
                    <DailyMissionCard
                      key={mission.id}
                      mission={mission}
                      progress={missionProgress as DailyMissionProgress}
                      onClaim={onMissionClaim}
                    />
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="misi">
              <div className="grid gap-4 p-4">
                {missions.map((mission) => {
                  // Only find regular mission progress (not daily mission progress)
                  const regularProgress = userProgress?.filter(
                    (p) => !("daily_mission_id" in p) && "mission_id" in p
                  ) as MissionProgress[];
                  
                  // Find the specific progress for this mission
                  const missionProgress = regularProgress?.find(
                    (p) => p.mission_id === mission.id
                  );
                  
                  return (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      progress={missionProgress}
                      onClaim={onMissionClaim}
                    />
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <RewardModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setCurrentReward(null);
          }}
          reward={currentReward}
        />
      </div>
    </div>
  );
}
