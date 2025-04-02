import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { InputFields } from "@/components/input-fields";
import { SubmitButton } from "@/components/submit-button";
import { Label } from "@/components/ui/label";
import { Link } from "lucide-react";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-6 py-8 bg-white rounded-md shadow-sm">
      <h1 className="text-2xl font-bold text-green-800 mb-1">Reset Password</h1>

      <form className="flex flex-col mt-6">
        <div className="flex flex-col gap-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password Baru
              </Label>
              <InputFields
                type="password"
                name="password"
                placeholder="Password baru"
                required
                className="rounded-xl bg-white border-slate-300"
                showPasswordToggle
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Konfirmasi Password
              </Label>
              <InputFields
                type="password"
                name="confirmPassword"
                placeholder="Konfirmasi password"
                required
                className="rounded-xl bg-white border-slate-300"
                showPasswordToggle
              />
            </div>
          </div>
          <FormMessage message={searchParams} />
          <SubmitButton
            pendingText="Mengubah password..."
            formAction={resetPasswordAction}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-6 rounded-xl mt-4"
          >
            Ubah Password
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
