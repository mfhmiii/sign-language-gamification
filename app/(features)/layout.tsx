import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "../globals.css";
import Image from "next/image";
import { BottomNav } from "@/components/bottom-nav";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function FeatureLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Image
            src="/images/bg.jpg"
            alt="Background"
            fill
            className="object-cover fixed top-0 left-0 w-full h-full z-[-1] blur-sm"
            // quality={100}
          />
          <div className="bg-green-400 xl:mx-36 md:mx-14 min-h-screen">
            <div className="bg-green-400 h-16 md:h-20 shadow-md sticky top-0 z-50 flex items-center justify-center">
              <h1 className="font-bold text-lg md:text-2xl">Contoh</h1>
            </div>
            {children}
          </div>
          {/* {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />} */}
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
