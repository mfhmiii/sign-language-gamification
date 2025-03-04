import { createClient } from "@/utils/supabase/client";
import { getUserProfile } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePages() {
  // const supabase = await createClient();
  const user = await getUserProfile();

  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }
  
    return (
      <>
        <div className="flex flex-col gap-2 items-center">
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
            <img
              // src={userData?.profile_picture || "/placeholder-user.png"}
              alt="User"
              className="w-full h-full rounded-full" />
          </div>
          <h3 className="text-gray-700 font-semibold mt-2">
            {user.username}
          </h3>
          <p className="text-gray-500 text-sm bg-slate-200 rounded-xl px-4 inline-block">
            {user.email}
          </p>
        </div>
        <h1>Profile bro</h1>
      </>
    );
  }