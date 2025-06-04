"use client";

import { Lock, CheckCircle, Star, Flag } from "lucide-react";
import { ProgressBar } from "./progress-bar";

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
  className?: string;
}

// Custom CircleProgress component
export type StageType = "locked" | "active" | "completed" | "finish";

interface CustomStageCircleProps {
  type: StageType;
  percentage?: number;
  isFirstUnlocked?: boolean;
  stageNumber?: number;
  onClick?: () => void;
}

// Export the CustomStageCircle component so it can be used in QuizPageClient.tsx
export function CustomStageCircle({
  type,
  percentage = 0,
  isFirstUnlocked = false,
  stageNumber,
  onClick
}: CustomStageCircleProps) {
  const isClickable = type !== "locked";
  
  return (
    <div className="relative flex flex-col items-center group">
      {/* START button for first unlocked stage with bouncing animation */}
      {isFirstUnlocked && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white text-green-500 font-bold py-2 px-8 rounded-lg shadow-md whitespace-nowrap border border-gray-200 animate-bounce">
            START
          </div>
        </div>
      )}
      
      <div
        onClick={isClickable ? onClick : undefined}
        className={`relative ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
      >
        {/* Circle with icon */}
        <div className="relative w-20 h-20">
          {type === "locked" ? (
            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center shadow-md">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
          ) : type === "completed" ? (
            <div className="w-full h-full rounded-full bg-green-500 flex items-center justify-center shadow-md">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          ) : type === "finish" ? (
            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center shadow-md">
              <Flag className="w-10 h-10 text-gray-400" />
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* Green background circle */}
              <div className="absolute inset-0 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                <Star className="w-12 h-12 text-white" fill="white" />
              </div>
              
              {/* Progress circle */}
              {percentage < 100 && (
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="36"
                    strokeWidth="8"
                    stroke="#E5E7EB"
                    fill="transparent"
                    className="opacity-50"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="36"
                    strokeWidth="8"
                    stroke="#FCD34D" // Yellow color for progress
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={`${percentage * 2.26} 226`} // 2*PI*r = ~226
                    className="transition-all duration-500 ease-in-out"
                  />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Hover percentage indicator */}
        {type === "active" && percentage !== undefined && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {percentage}%
          </div>
        )}
      </div>

      {/* Stage Number */}
      {type !== "locked" && type !== "finish" && stageNumber !== undefined && (
        <div className="mt-2 text-gray-700 font-medium">
          {stageNumber}
        </div>
      )}
      
      {/* Finish label */}
      {type === "finish" && (
        <div className="mt-2 text-gray-700 font-medium">
          Finish
        </div>
      )}
    </div>
  );
}

export function StageIndicator({
  stages,
  onStageClick,
  isStageLocked,
  className = "",
}: StageIndicatorProps) {
  // Find the index of the first unlocked stage
  const firstUnlockedIndex = stages.findIndex(
    (s, i) => !isStageLocked(i) && !s.is_completed
  );

  return (
    <div className={`relative w-full max-w-4xl py-16 px-4 mx-auto ${className}`}>
      <div className="relative w-full flex items-center justify-center">
        {/* Steps container with stage indicators and progress bars between them */}
        <div className="w-full flex flex-row items-center justify-center overflow-visible relative z-10">
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
            
            // Determine stage type
            let stageType: StageType = "locked";
            if (!isLocked) {
              stageType = isCompleted ? "completed" : "active";
            }

            return (
              <div key={stage.id} className="flex items-center flex-shrink-0">
                <CustomStageCircle 
                  type={stageType}
                  percentage={progressPercentage}
                  isFirstUnlocked={isFirstUnlocked}
                  stageNumber={stage.stage}
                  onClick={() => onStageClick(stage, index)}
                />

                {/* Progress bar connector */}
                {index < stages.length - 1 && (
                  <ProgressBar percentage={progressPercentage} />
                )}
              </div>
            );
          })}

          {/* Add progress bar for the last stage before finish line */}
          {stages.length > 0 && (
            <ProgressBar 
              percentage={
                stages[stages.length - 1].is_completed 
                  ? 100 
                  : stages[stages.length - 1].percentage || 0
              } 
            />
          )}

          {/* Finish line indicator */}
          <CustomStageCircle type="finish" />
        </div>
      </div>
    </div>
  );
}
