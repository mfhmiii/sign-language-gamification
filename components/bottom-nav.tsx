"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Target, Trophy, User, BookOpen } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Beranda", href: "/home", icon: Home },
    { name: "Misi", href: "/misi", icon: Target },
    // Special middle button
    { name: "Kamus", href: "/kamus", icon: BookOpen, special: true },
    { name: "Leaderboard", href: "/papan-peringkat", icon: Trophy },
    { name: "Profil", href: "/profile/get", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2"> {/* Changed from bg-background */}
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map(({ name, href, icon: Icon, special }) => {
          const isActive = pathname === href;

          if (special) {
            return (
              <Link
                key={name}
                href={href}
                className="flex flex-col items-center group"
              >
                <div
                  className={`
                  ${isActive ? "bg-yellow-500" : "bg-black"} 
                  text-white rounded-full p-3 -mt-6 shadow-lg 
                  transition-all duration-200 
                  group-hover:shadow-xl group-hover:scale-110 
                  ${isActive ? "group-hover:bg-yellow-400" : "group-hover:bg-gray-800"}
                `}
                >
                  <Icon size={24} className={isActive ? "animate-pulse" : ""} />
                </div>
                <span
                  className={`
                  text-xs 
                  ${isActive ? "text-black font-medium" : "text-gray-500"} 
                  mt-1
                  transition-colors duration-200
                  group-hover:${isActive ? "text-gray-900" : "text-gray-700"}
                `}
                >
                  {name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={name}
              href={href}
              className="flex flex-col items-center gap-1 group transition-transform duration-200 hover:scale-105"
            >
              <Icon
                size={24}
                className={`
                  ${isActive ? "text-black" : "text-gray-500"}
                  transition-colors duration-200
                  group-hover:${isActive ? "text-gray-900" : "text-gray-700"}
                `}
              />
              <span
                className={`
                text-xs 
                ${isActive ? "text-black font-medium" : "text-gray-500"}
                transition-colors duration-200
                group-hover:${isActive ? "text-gray-900" : "text-gray-700"}
              `}
              >
                {name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
