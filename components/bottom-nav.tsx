"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Target, Trophy, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Beranda", href: "/home", icon: Home },
    { name: "Misi", href: "/mission", icon: Target },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Profil", href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-background border-t border-foreground/10 p-2">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map(({ name, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link key={name} href={href} className="flex flex-col items-center gap-1">
              <Icon size={24} className={isActive ? "text-primary" : "text-muted-foreground"} />
              <span className={`text-xs ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
