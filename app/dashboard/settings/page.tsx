import { createClient } from "@/lib/supabase/server"
import { SettingsContent } from "@/components/dashboard/settings-content"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and expense categories.
        </p>
      </div>

      <SettingsContent
        profile={profile}
        categories={categories || []}
        userId={user.id}
        userEmail={user.email || ""}
      />
    </div>
  )
}
