export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

function translateErrorMessage(message: string): string {
  const errorMessages: Record<string, string> = {
    "Invalid login credentials": "Email atau password salah",
    "Email not confirmed": "Email belum dikonfirmasi",
    "Invalid email format": "Format email tidak valid",
    "Password should be at least 6 characters": "Password minimal 6 karakter",
    "Email already registered": "Email sudah terdaftar",
    "User not found": "Pengguna tidak ditemukan",
    "Invalid reset password": "Link reset password tidak valid atau kadaluarsa",
  };

  return errorMessages[message] || message;
}

export function FormMessage({ message }: { message: Message | null }) {
  console.log("FormMessage received message:", message);

  if (!message) {
    console.log("No message provided");
    return null;
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {"success" in message && (
        <div className="text-foreground border-l-2 border-foreground px-4">
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div className="bg-destructive/10 text-destructive border-l-2 border-destructive px-4 py-2 rounded">
          {translateErrorMessage(message.error)}
        </div>
      )}
      {"message" in message && (
        <div className="text-foreground border-l-2 px-4">{message.message}</div>
      )}
    </div>
  );
}
