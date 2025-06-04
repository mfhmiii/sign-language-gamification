"use client";

interface ProgressBarProps {
  percentage: number;
  className?: string;
  vertical?: boolean;
}

export function ProgressBar({
  percentage,
  className = "",
  vertical = false,
}: ProgressBarProps) {
  if (vertical) {
    return (
      <div className={`h-16 w-1 bg-gray-200 my-2 relative ${className}`}>
        <div
          className="absolute top-0 left-0 w-full bg-green-500"
          style={{
            height: `${percentage}%`,
            transition: "height 0.5s ease-in-out",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative h-1 bg-gray-200 w-16 md:w-8 lg:w-12 xl:w-16 mx-2 ${className}`}
    >
      <div
        className="h-full bg-green-500"
        style={{
          width: `${percentage}%`,
          transition: "width 0.5s ease-in-out",
        }}
      />
    </div>
  );
}
