"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Receipt, Landmark, ArrowRight } from "lucide-react"

interface SummaryCardsProps {
  totalSpent: number
  monthlyBudget: number
  transactionCount: number
  topCategory: string
  chequingBalance: number
}

export function SummaryCards({
  totalSpent,
  monthlyBudget,
  transactionCount,
  topCategory,
  chequingBalance,
}: SummaryCardsProps) {
  const budgetPercentage = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0
  const remaining = monthlyBudget - totalSpent
  const chequingAfterBudget = chequingBalance - monthlyBudget

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Chequing Balance Card */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Chequing
          </CardTitle>
          <Landmark className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            ${chequingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <span>-${monthlyBudget.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            <ArrowRight className="h-3 w-3" />
            <span>Budget</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Spent
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            ${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This month
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Budget Remaining
          </CardTitle>
          {remaining >= 0 ? (
            <TrendingUp className="h-4 w-4 text-primary" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${remaining >= 0 ? "text-foreground" : "text-destructive"}`}>
            ${Math.abs(remaining).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {budgetPercentage.toFixed(0)}% of budget used
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Transactions
          </CardTitle>
          <Receipt className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {transactionCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This month
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top Category
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground truncate">
            {topCategory || "N/A"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Highest spending
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
