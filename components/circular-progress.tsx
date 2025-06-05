"use client";

interface CircularProgressProps {
  percentage: number;
  size?: number | string;
  strokeWidth?: number;
  label?: string;
}

export function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 8,
  label = "Complete",
}: CircularProgressProps) {
  // Convert string size to number if needed
  const sizeNum = typeof size === "string" ? 80 : size;
  const radius = (sizeNum - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width="100%" height="100%" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#E0E0E0" // Light gray background
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#000000" // Black progress bar
          fill="transparent"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 0.5s",
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-base sm:text-xl font-semibold text-black"> {/* Added text-black */}
          {percentage}%
        </span>
        <span className="text-xs text-black"> {/* Changed from text-muted-foreground to text-black */}
          {label}
        </span>
      </div>
    </div>
  );
}
