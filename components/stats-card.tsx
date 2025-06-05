import type React from "react";

type StatItemProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  classname?: string;
};

const StatItem = ({ icon, label, value }: StatItemProps) => {
  return (
    <div className="flex flex-col items-center px-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6">{icon}</div>
        <span className="text-black"> {/* Changed from text-gray-500 to text-black */}
          {label}
        </span>
      </div>
      <p className="text-xl md:text-2xl font-bold text-black"> {/* Added text-black */}
        {value}
      </p>
    </div>
  );
};

type StatsCardProps = {
  points: number;
  ranking: number;
  level: number;
  className?: string;
};

export default function StatsCard({
  points,
  ranking,
  level,
  className = "",
}: StatsCardProps) {
  return (
    <div className={`bg-white rounded-xl py-4 shadow-sm ${className}`}>
      <div className="grid grid-cols-3 divide-x-2 divide-green-400">
        <StatItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#F6C833"
              className="w-6 h-6"
            >
              <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z"
                clipRule="evenodd"
              />
            </svg>
          }
          label="Poin"
          value={points}
        />
        <StatItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#F6C833"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743-.356l1.918-.56a.75.75 0 00.523-.71v-5.57a.75.75 0 00-.522-.71l-1.919-.56a6.767 6.767 0 00-2.743-.356 6.753 6.753 0 00-2.483.466z"
                clipRule="evenodd"
              />
              <path d="M1.636 14.408a.75.75 0 01.584-.86 24.283 24.283 0 015.413-1.139 6.75 6.75 0 01.6 1.187 23.052 23.052 0 00-4.93 1.079.75.75 0 01-.867-.583 6.922 6.922 0 01-.8.316zm12.768-5.17a.75.75 0 01.522.709v5.571a.75.75 0 01-.522.71l-1.919.561c-.9.262-1.826.39-2.743.356a6.753 6.753 0 01-6.138-5.6.75.75 0 01.584-.858 24.016 24.016 0 015.413-1.14 6.75 6.75 0 01.6 1.187 23.053 23.053 0 00-4.93 1.08.75.75 0 01-.867-.584 6.602 6.602 0 01-.8.316 6.767 6.767 0 002.743-.356l1.919-.56a.75.75 0 01.522-.71zm1.338 8.425a.75.75 0 01-.584.86 24.282 24.282 0 01-5.413 1.138 6.75 6.75 0 01-.6-1.187 23.053 23.053 0 004.93-1.08.75.75 0 01.867.585 6.598 6.598 0 00.8-.316z" />
            </svg>
          }
          label="Ranking"
          value={ranking}
        />
        <StatItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#F6C833"
              className="w-6 h-6"
            >
              <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" />
              <path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13 1.37.739a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.71 0l-9.75-5.25a.75.75 0 010-1.32l1.37-.738z" />
              <path d="M10.933 19.231l-7.668-4.13-1.37.739a.75.75 0 000 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 000-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 01-2.134-.001z" />
            </svg>
          }
          label="Level"
          value={level}
        />
      </div>
    </div>
  );
}
