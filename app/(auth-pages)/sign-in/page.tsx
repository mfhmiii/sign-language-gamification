"use client";

import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { InputFields } from "@/components/input-fields";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";

export default function Login(props: { searchParams: Promise<Message> }) {
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    const handleSearchParams = async () => {
      try {
        const params = await props.searchParams;
        console.log("Resolved params:", params);
        if (params) {
          console.log("Setting message state:", params);
          setMessage(params);
        }
      } catch (error) {
        console.error("Error handling search params:", error);
      }
    };

    handleSearchParams();
  }, [props.searchParams]);

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-6 py-8 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-bold text-green-800 mb-1">Masuk</h1>

      <form className="flex flex-col mt-6">
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Nama Panggilan
            </Label>
            <div className="relative">
              <InputFields
                name="email"
                placeholder="Masukkan email"
                required
                className="rounded-xl bg-white border-slate-300"
                icon={<Mail size={16} />}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link
                className="text-xs text-green-600 font-medium"
                href="/forgot-password"
              >
                Lupa password?
              </Link>
            </div>
            <div className="relative">
              <InputFields
                type="password"
                name="password"
                placeholder="Masukkan password kamu"
                required
                className="rounded-xl bg-white border-slate-300"
                icon={<KeyRound size={16} />}
                showPasswordToggle
              />
            </div>
          </div>

          <FormMessage message={message} />

          <SubmitButton
            pendingText="Masuk..."
            formAction={signInAction}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-6 rounded-xl mt-4"
          >
            Masuk
          </SubmitButton>

          <p className="text-sm text-center text-gray-600 mt-4">
            Belum punya akun?{" "}
            <Link className="text-green-600 font-medium" href="/sign-up">
              Daftar
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
