"use client";

import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { InputFields } from "@/components/input-fields";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useState, useEffect } from "react";

export default function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    const handleSearchParams = async () => {
      try {
        const params = await props.searchParams;
        if (params) {
          setMessage(params);
        }
      } catch (error) {
        console.error("Error handling search params:", error);
      }
    };

    handleSearchParams();
  }, [props.searchParams]);

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-6 py-8 bg-white rounded-md shadow-sm">
      <h1 className="text-2xl font-bold text-green-800 mb-1">Reset Password</h1>
      <p className="text-sm text-secondary-foreground">
        Already have an account?{" "}
        <Link className="text-primary underline" href="/sign-in">
          Sign in
        </Link>
      </p>

      <form className="flex flex-col mt-6">
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <InputFields
                name="email"
                placeholder="you@example.com"
                required
                className="rounded-xl bg-white border-slate-300"
                icon={<Mail size={16} />}
              />
            </div>
          </div>
          <FormMessage message={message} />
          <SubmitButton
            pendingText="Mengirim Email..."
            formAction={forgotPasswordAction}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-6 rounded-xl mt-4"
          >
            Kirim Link Reset Password
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
