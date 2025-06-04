"use client";

import { Lock, CheckCircle, Star, Flag } from "lucide-react";
import { CircularProgress } from "./circular-progress";

export type StageType = "locked" | "active" | "completed" | "finish";

interface StageCircleProps {
  type: StageType;
  percentage?: number;
  isFirstUnlocked?: boolean;
  stageNumber?: number;
  onClick?: () => void;
}

export function StageCircle({
  type,
  percentage = 0,
  isFirstUnlocked = false,
  stageNumber,
  onClick,
}: StageCircleProps) {
  const isClickable = type !== "locked";

  return (
    <div className="relative flex flex-col items-center group">
      <div
        onClick={isClickable ? onClick : undefined}
        className={`relative ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
      >
        {/* Circle with icon or CircularProgress */}
        <div className="relative w-20 h-20">
          {type === "locked" ? (
            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center shadow-lg">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
          ) : type === "completed" ? (
            <div className="w-full h-full rounded-full bg-green-500 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          ) : type === "finish" ? (
            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center shadow-lg">
              <Flag className="w-10 h-10 text-gray-400" />
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
                  percentage={percentage}
                  size={80}
                  strokeWidth={8}
                  label=""
                />
              </div>
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

      {/* START button for first unlocked stage */}
      {isFirstUnlocked && (
        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2">
          <div className="bg-green-500 text-white font-bold py-2 px-8 rounded-lg shadow-md whitespace-nowrap">
            START
          </div>
        </div>
      )}

      {/* Stage Number */}
      {type !== "locked" && type !== "finish" && stageNumber !== undefined && (
        <div className="mt-2 text-gray-700 font-medium">{stageNumber}</div>
      )}

      {/* Finish label */}
      {type === "finish" && (
        <div className="mt-2 text-gray-700 font-medium">Finish</div>
      )}
    </div>
  );
}
