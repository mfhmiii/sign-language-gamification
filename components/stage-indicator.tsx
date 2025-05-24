"use client";

import { Lock, CheckCircle, Star, Flag } from "lucide-react";
import { CircularProgress } from "./circular-progress";

interface Stage {
  id: string;
  stage: number;
  is_completed: boolean;
  percentage?: number;
}

interface StageIndicatorProps {
  stages: Stage[];
  onStageClick: (stage: Stage, index: number) => void;
  isStageLocked: (index: number) => boolean;
}

export function StageIndicator({
  stages,
  onStageClick,
  isStageLocked,
}: StageIndicatorProps) {
  // Find the index of the first unlocked stage
  const firstUnlockedIndex = stages.findIndex(
    (s, i) => !isStageLocked(i) && !s.is_completed
  );
  
  // Find the current stage with progress
  const currentStageIndex = stages.findIndex(
    (s, i) => !isStageLocked(i) && !s.is_completed
  );

  return (
    <div className="relative w-full max-w-4xl py-8 px-4">
      <div className="relative w-full flex items-center justify-between">
        {/* Steps container with stage indicators and progress bars between them */}
        <div className="w-full flex flex-row items-center justify-start relative z-10">
          {stages.map((stage, index) => {
            const isLocked = isStageLocked(index);
            const isCompleted = stage.is_completed;
            const isFirstUnlocked =
              !isLocked &&
              !isCompleted &&
              index === firstUnlockedIndex;
            
            const progressPercentage = isCompleted ? 100 : 
                                      (!isLocked && stage.percentage) ? stage.percentage : 
                                      isLocked ? 0 : 0;

            return (
              <div key={stage.id} className="flex items-center">
                <div className="relative flex flex-col items-center group">
                  <div
                    onClick={() => onStageClick(stage, index)}
                    className={`relative ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {/* Circle with icon or CircularProgress */}
                    <div className="relative w-20 h-20">
                      {isLocked ? (
                        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center shadow-lg">
                          <Lock className="w-10 h-10 text-gray-400" />
                        </div>
                      ) : isCompleted ? (
                        <div className="w-full h-full rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Add solid green background circle */}
                          <div className="absolute inset-0 rounded-full bg-green-500 z-0"></div>
                          
                          {/* Star icon on top of green background */}
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                            <Star className="w-12 h-12 text-white" fill="currentColor" />
                          </div>
                          
                          {/* CircularProgress on top with transparent background */}
                          <div className="relative z-20">
                            <CircularProgress
                              percentage={progressPercentage}
                              size={80}
                              strokeWidth={8}
                              label=""
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hover percentage indicator */}
                    {!isLocked && !isCompleted && stage.percentage !== undefined && (
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {stage.percentage}%
                      </div>
                    )}
                  </div>

                  {/* START button for first unlocked stage */}
                  {isFirstUnlocked && (
                    <div className="absolute -top-14 left-1/2 transform -translate-x-1/2">
                      <div className="bg-green-500 text-white font-bold py-2 px-8 rounded-lg shadow-md whitespace-nowrap">
                        START
                      </div>
                    </div>
                  )}

                  {/* Stage Number */}
                  {!isLocked && (
                    <div className="mt-2 text-gray-700 font-medium">
                      {stage.stage}
                    </div>
                  )}
                </div>

                {/* Progress bar connector */}
                {index < stages.length && (
                  <div className="relative h-1 bg-gray-200 w-32 mx-2">
                    <div 
                      className="h-full bg-green-500" 
                      style={{
                        width: `${progressPercentage}%`,
                        transition: "width 0.5s ease-in-out"
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Finish line indicator */}
          <div className="relative flex flex-col items-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-200 shadow-lg">
              <Flag className="w-10 h-10 text-gray-400" />
            </div>
            <div className="mt-2 text-gray-700 font-medium">
              Finish
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
