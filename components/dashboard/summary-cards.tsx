"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Receipt, Landmark } from "lucide-react"

interface SummaryCardsProps {
  totalSpent: number
  monthlyBudget: number
  transactionCount: number
  topCategory: string
  chequingBalance: number
  totalIncome: number
}

export function SummaryCards({
  totalSpent,
  monthlyBudget,
  transactionCount,
  topCategory,
  chequingBalance,
  totalIncome,
}: SummaryCardsProps) {
  const budgetPercentage = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0
  const budgetRemaining = monthlyBudget - totalSpent

  // Chequing = base balance set by user + all income - total spent this month
  const currentChequing = chequingBalance + totalIncome - totalSpent

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

      {/* Chequing Balance */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Chequing Balance</CardTitle>
          <Landmark className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${currentChequing >= 0 ? "text-foreground" : "text-destructive"}`}>
            ${Math.abs(currentChequing).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            {currentChequing < 0 && <span className="text-sm ml-1">overdrawn</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Base ${chequingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} + income − spent
          </p>
        </CardContent>
      </Card>

      {/* Total Spent */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            ${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </CardContent>
      </Card>

      {/* Budget Remaining */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Budget Remaining</CardTitle>
          {budgetRemaining >= 0 ? (
            <TrendingUp className="h-4 w-4 text-primary" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${budgetRemaining >= 0 ? "text-foreground" : "text-destructive"}`}>
            ${Math.abs(budgetRemaining).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {budgetPercentage.toFixed(0)}% of ${monthlyBudget.toLocaleString("en-US", { minimumFractionDigits: 2 })} used
          </p>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          <Receipt className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{transactionCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {topCategory ? `Top: ${topCategory}` : "This month"}
          </p>
        </CardContent>
      </Card>

    </div>
  )
}
