"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import "./globals.css";

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.push("/home");
      }
    };

    checkUser();
  }, [router, supabase]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-400/5 to-green-400/10">
      <nav className="w-full flex justify-between items-center px-6 py-4">
        <div className="text-2xl font-bold text-green-400">SignQuest</div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold">
              Belajar Bahasa Isyarat Melalui
              <span className="text-green-400 block">
                Pengalaman Bermain Game
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Kuasai bahasa isyarat sambil bersenang-senang! Selesaikan misi,
              dapatkan hadiah, dan pantau perkembanganmu dalam lingkungan
              belajar yang menyenangkan.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={() => router.push("/sign-in")}
                className="text-lg bg-green-400 hover:bg-green-500"
              >
                Mulai Sekarang
              </Button>
            </div>

            {/* <div className="grid grid-cols-3 gap-8 pt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">60+</div>
                <div className="text-sm text-muted-foreground">
                  Kata Isyarat
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">50+</div>
                <div className="text-sm text-muted-foreground">Pencapaian</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">24/7</div>
                <div className="text-sm text-muted-foreground">
                  Akses Belajar
                </div>
              </div>
            </div> */}
          </div>

          <div className="relative">
            <div className="w-full aspect-square max-w-[600px] mx-auto">
              <DotLottieReact
                src="https://lottie.host/e84f35ae-372b-4b05-844e-bf64105a1d9a/Xmb2Lo5si9.lottie"
                loop
                autoplay
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
