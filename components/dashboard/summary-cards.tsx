"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Receipt, Landmark, ArrowDownRight, ArrowUpRight } from "lucide-react"

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
  const availableBalance = chequingBalance - monthlyBudget

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">

      {/* Chequing Balance */}
      <Card className="bg-card border-border lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Chequing Balance</CardTitle>
          <Landmark className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            ${chequingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <ArrowDownRight className="h-3 w-3 text-orange-400" />
            <span className="text-orange-400">
              -${monthlyBudget.toLocaleString("en-US", { minimumFractionDigits: 2 })} budget
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Available After Budget */}
      <Card className="bg-card border-border lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          {availableBalance >= 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${availableBalance >= 0 ? "text-emerald-500" : "text-destructive"}`}>
            ${Math.abs(availableBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">After monthly budget</p>
        </CardContent>
      </Card>

      {/* Total Income */}
      <Card className="bg-card border-border lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-500">
            ${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">All recorded income</p>
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
            {budgetPercentage.toFixed(0)}% of budget used
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