import { createClient } from "@/lib/supabase/server"
import { StatementUploader } from "@/components/dashboard/statement-uploader"

export default async function StatementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, color")
    .eq("user_id", user.id)
    .order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bank Statements</h1>
        <p className="text-muted-foreground">
          Upload your bank statement PDF every 2 weeks. All transactions will be extracted and imported automatically.
        </p>
      </div>
      <StatementUploader userId={user.id} categories={categories || []} />
    </div>
  )
}
