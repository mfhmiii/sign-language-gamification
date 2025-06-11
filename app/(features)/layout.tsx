"use client";

import { Geist } from "next/font/google";
import "../globals.css";
import { BottomNav } from "@/components/bottom-nav";
import TopBar from "@/components/topbar";
import { usePathname } from "next/navigation";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function FeatureLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isQuizPage = pathname.includes('/quiz/') && !pathname.endsWith('/quiz');
  
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body>
          <TopBar/>
          <div className="bg-green-400 min-h-screen">{children}</div>
          {!isQuizPage && <BottomNav/>}
      </body>
    </html>
  );
}


