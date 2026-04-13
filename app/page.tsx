import { createClient } from "@/lib/supabase/server"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { ExpenseCharts } from "@/components/dashboard/expense-charts"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const monthStart = startOfMonth(new Date())
  const monthEnd = endOfMonth(new Date())

  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5))

  const { data: expenses } = await supabase
    .from("expenses")
    .select(`*, category:categories(name, color)`)
    .eq("user_id", user.id)
    .gte("date", sixMonthsAgo.toISOString().split("T")[0])
    .lte("date", monthEnd.toISOString().split("T")[0])
    .order("date", { ascending: false })

  // Current month expenses only (for summary cards)
  const thisMonthExpenses = expenses?.filter(e =>
    e.date >= monthStart.toISOString().split("T")[0] &&
    e.date <= monthEnd.toISOString().split("T")[0]
  ) || []

  const { data: incomes } = await supabase
    .from("incomes")
    .select("amount")
    .eq("user_id", user.id)

  const { data: profile } = await supabase
    .from("profiles")
    .select("monthly_budget, chequing_balance")
    .eq("id", user.id)
    .single()

  const totalSpent = thisMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const totalIncome = incomes?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0
  const monthlyBudget = Number(profile?.monthly_budget || 0)
  const chequingBalance = Number(profile?.chequing_balance || 0)
  const transactionCount = thisMonthExpenses.length

  const categoryTotals = new Map<string, { name: string; amount: number; color: string }>()
  thisMonthExpenses.forEach((expense) => {
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

  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i)
    const mStart = startOfMonth(monthDate).toISOString().split("T")[0]
    const mEnd = endOfMonth(monthDate).toISOString().split("T")[0]
    const monthTotal = expenses
      ?.filter(e => e.date >= mStart && e.date <= mEnd)
      .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
    monthlyData.push({ date: format(monthDate, "MMM"), amount: monthTotal })
  }

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
        <p className="text-muted-foreground">Welcome back! Here&apos;s your financial overview.</p>
      </div>
      <SummaryCards
        totalSpent={totalSpent}
        monthlyBudget={monthlyBudget}
        chequingBalance={chequingBalance}
        transactionCount={transactionCount}
        topCategory={topCategory}
        totalIncome={totalIncome}
      />
      <ExpenseCharts categoryData={categoryData} monthlyData={monthlyData} />
      <RecentTransactions transactions={recentTransactions} />
    </div>
  )
}
