"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { ExpenseForm } from "./expense-form"
import { format } from "date-fns"

interface Category {
  id: string
  name: string
  color: string
}

interface Expense {
  id: string
  merchant: string
  amount: number
  date: string
  notes: string | null
  category_id: string | null
  category: Category | null
}

interface ExpensesListProps {
  expenses: Expense[]
  categories: Category[]
  userId: string
}

export function ExpensesList({ expenses, categories, userId }: ExpensesListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from("expenses").delete().eq("id", deleteId)
    setDeleteId(null)
    router.refresh()
  }

  function handleEdit(expense: Expense) {
    setEditingExpense(expense)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingExpense(null)
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">All Expenses</CardTitle>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No expenses yet.</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first expense
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-2 h-12 rounded-full"
                      style={{ backgroundColor: expense.category?.color || "#6b7280" }}
                    />
                    <div>
                      <p className="font-medium text-foreground">{expense.merchant}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.category?.name || "Uncategorized"} •{" "}
                        {format(new Date(expense.date), "MMM d, yyyy")}
                      </p>
                      {expense.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {expense.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-foreground">
                      -${Number(expense.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem onClick={() => handleEdit(expense)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(expense.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ExpenseForm
        open={showForm}
        onOpenChange={handleCloseForm}
        categories={categories}
        expense={editingExpense}
        userId={userId}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Expense</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
