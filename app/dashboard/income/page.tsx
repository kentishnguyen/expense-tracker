import { createClient } from "@/lib/supabase/server"
import { IncomeList } from "@/components/dashboard/income-list"

export default async function IncomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: incomes } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })

  const totalIncome = incomes?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Income</h1>
        <p className="text-muted-foreground">Track your salary, bursaries, scholarships, and other income sources.</p>
      </div>
      <IncomeList incomes={incomes || []} userId={user.id} totalIncome={totalIncome} />
    </div>
  )
}