import { createClient } from "@/lib/supabase/server"
import { ExpensesList } from "@/components/dashboard/expenses-list"

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch all expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select(`
      *,
      category:categories(id, name, color)
    `)
    .eq("user_id", user.id)
    .order("date", { ascending: false })

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, color")
    .eq("user_id", user.id)
    .order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
        <p className="text-muted-foreground">
          Manage and track all your expenses.
        </p>
      </div>

      <ExpensesList
        expenses={expenses || []}
        categories={categories || []}
        userId={user.id}
      />
    </div>
  )
}
