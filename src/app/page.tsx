import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Corrupted token — send to login
  }

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
