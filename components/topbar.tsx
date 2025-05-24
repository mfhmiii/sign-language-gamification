"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const isQuizPage = pathname.includes("quiz/1") || 
                     pathname.includes("quiz/2") || 
                     pathname.includes("quiz/3");
  
  const pageTitle =
    pathname === "/"
      ? "Home"
      : pathname.includes("profile/get") ||
          pathname.includes("profile/view") ||
          pathname.includes("profile/edit")
        ? "Profile"
        : isQuizPage
          ? "Quiz"
          : pathname
              .split("/")
              .filter(Boolean)
              .map((segment) =>
                segment
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (char) => char.toUpperCase())
              )
              .join(" / ");

  return (
    <div className="bg-green-400 h-16 md:h-20 shadow-md sticky top-0 z-50 flex items-center justify-center">
      {isQuizPage ? (
        <div className="flex items-center justify-between w-full xl:mx-36 md:mx-14 sm:mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => router.push("/home")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
          <div className="w-8 h-8" /> {/* Spacer for alignment */}
        </div>
      ) : (
        <h1 className="font-bold text-lg md:text-2xl">{pageTitle}</h1>
      )}
    </div>
  );
}
