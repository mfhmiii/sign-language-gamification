"use client";

import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { InputFields } from "@/components/input-fields";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, User, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";

export default function Signup(props: { searchParams: Promise<Message> }) {
  const [message, setMessage] = useState<Message | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatch, setPasswordMatch] = useState(true);

  useEffect(() => {
    props.searchParams.then((params) => {
      if (params && "message" in params) {
        setMessage(params);
      }
    });
  }, [props.searchParams]);

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordMatch(false);
      setMessage({ error: "Konfirmasi password tidak cocok dengan password" });
    } else {
      setPasswordMatch(true);
      setMessage(null);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (formData: FormData) => {
    const password = formData.get("password") as string;
    const confirmPwd = formData.get("confirmPassword") as string;

    if (password !== confirmPwd) {
      setPasswordMatch(false);
      setMessage({ error: "Password tidak cocok" });
      return;
    }

    setPasswordMatch(true);
    setMessage(null);
    await signUpAction(formData);
  };

  if (message && "success" in message) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={message} />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-6 py-8 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-bold text-green-800 mb-1">Daftar</h1>
      <form className="flex flex-col mt-6" action={handleSubmit}>
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
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
            <Label htmlFor="username" className="text-sm font-medium">
              Username
            </Label>
            <div className="relative">
              <InputFields
                name="username"
                placeholder="Masukkan username"
                required
                className="rounded-xl bg-white border-slate-300"
                icon={<User size={16} />}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <InputFields
                type="password"
                name="password"
                placeholder="Masukkan password kamu"
                minLength={6}
                required
                className="rounded-xl bg-white border-slate-300"
                icon={<KeyRound size={16} />}
                showPasswordToggle
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <div className="relative">
              <InputFields
                type="password"
                name="confirmPassword"
                placeholder="Konfirmasi password kamu"
                minLength={6}
                required
                className="rounded-xl bg-white border-slate-300"
                icon={<KeyRound size={16} />}
                showPasswordToggle
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <FormMessage message={message} />

          <SubmitButton
            pendingText="Mendaftar..."
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-6 rounded-xl mt-4"
          >
            Daftar
          </SubmitButton>

          <p className="text-sm text-center text-gray-600 mt-4">
            Sudah punya akun?{" "}
            <Link className="text-green-600 font-medium" href="/sign-in">
              Masuk
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
