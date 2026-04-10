import { createClient } from "@/lib/supabase/server"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { ExpenseCharts } from "@/components/dashboard/expense-charts"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { startOfMonth, endOfMonth, format, subDays } from "date-fns"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const monthStart = startOfMonth(new Date())
  const monthEnd = endOfMonth(new Date())

  // Fetch expenses for this month
  const { data: expenses } = await supabase
    .from("expenses")
    .select(`
      *,
      category:categories(name, color)
    `)
    .eq("user_id", user.id)
    .gte("date", monthStart.toISOString().split("T")[0])
    .lte("date", monthEnd.toISOString().split("T")[0])
    .order("date", { ascending: false })

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)

  // Fetch profile for monthly budget
  const { data: profile } = await supabase
    .from("profiles")
    .select("monthly_budget")
    .eq("id", user.id)
    .single()

  // Calculate totals
  const totalSpent = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
  const monthlyBudget = Number(profile?.monthly_budget || 0)
  const transactionCount = expenses?.length || 0

  // Calculate category breakdown
  const categoryTotals = new Map<string, { name: string; amount: number; color: string }>()
  expenses?.forEach((expense) => {
    const catName = expense.category?.name || "Uncategorized"
    const catColor = expense.category?.color || "#6b7280"
    const current = categoryTotals.get(catName) || { name: catName, amount: 0, color: catColor }
    current.amount += Number(expense.amount)
    categoryTotals.set(catName, current)
  })

  const categoryData = Array.from(categoryTotals.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)

  const topCategory = categoryData[0]?.name || ""

  // Calculate daily spending for last 7 days
  const dailyData = []
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dateStr = format(date, "yyyy-MM-dd")
    const dayExpenses = expenses?.filter((e) => e.date === dateStr) || []
    const dayTotal = dayExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    dailyData.push({
      date: format(date, "EEE"),
      amount: dayTotal,
    })
  }

  // Recent transactions (last 5)
  const recentTransactions = (expenses || []).slice(0, 5).map((exp) => ({
    id: exp.id,
    merchant: exp.merchant,
    amount: exp.amount,
    date: exp.date,
    category: exp.category,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your financial overview.
        </p>
      </div>

      <SummaryCards
        totalSpent={totalSpent}
        monthlyBudget={monthlyBudget}
        transactionCount={transactionCount}
        topCategory={topCategory}
      />

      <ExpenseCharts categoryData={categoryData} dailyData={dailyData} />

      <RecentTransactions transactions={recentTransactions} />
    </div>
  )
}