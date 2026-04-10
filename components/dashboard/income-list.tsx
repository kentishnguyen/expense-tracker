"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, Loader2, TrendingUp, GraduationCap, Briefcase, Gift, DollarSign } from "lucide-react"
import { format } from "date-fns"

const INCOME_TYPES = [
  { value: "salary", label: "Salary", icon: Briefcase },
  { value: "bursary", label: "Bursary", icon: GraduationCap },
  { value: "scholarship", label: "Scholarship", icon: GraduationCap },
  { value: "freelance", label: "Freelance", icon: Briefcase },
  { value: "gift", label: "Gift", icon: Gift },
  { value: "other", label: "Other", icon: DollarSign },
]

const TYPE_COLORS: Record<string, string> = {
  salary: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  bursary: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  scholarship: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  freelance: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  gift: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  other: "bg-gray-500/10 text-gray-400 border-gray-500/20",
}

interface Income {
  id: string
  source: string
  type: string
  amount: number
  date: string
  notes: string | null
  recurring: boolean
}

interface IncomeListProps {
  incomes: Income[]
  userId: string
  totalIncome: number
}

const emptyForm = { source: "", type: "salary", amount: "", date: new Date().toISOString().split("T")[0], notes: "", recurring: false }

export function IncomeList({ incomes, userId, totalIncome }: IncomeListProps) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Income | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const router = useRouter()
  const supabase = createClient()

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(income: Income) {
    setEditing(income)
    setForm({
      source: income.source,
      type: income.type,
      amount: income.amount.toString(),
      date: income.date,
      notes: income.notes || "",
      recurring: income.recurring,
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const payload = {
      user_id: userId,
      source: form.source,
      type: form.type,
      amount: parseFloat(form.amount),
      date: form.date,
      notes: form.notes || null,
      recurring: form.recurring,
    }

    if (editing) {
      await supabase.from("incomes").update(payload).eq("id", editing.id)
    } else {
      await supabase.from("incomes").insert(payload)
    }

    setIsLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from("incomes").delete().eq("id", deleteId)
    setDeleteId(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              ${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{incomes.length} income source{incomes.length !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>

        {/* Breakdown by type */}
        <Card className="bg-card border-border md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">By Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {INCOME_TYPES.map((t) => {
                const typeTotal = incomes.filter(i => i.type === t.value).reduce((sum, i) => sum + Number(i.amount), 0)
                if (typeTotal === 0) return null
                return (
                  <div key={t.value} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${TYPE_COLORS[t.value]}`}>
                    <t.icon className="h-3 w-3" />
                    {t.label}: ${typeTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                )
              })}
              {incomes.length === 0 && <p className="text-sm text-muted-foreground">No income recorded yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income list */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Income Sources</CardTitle>
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Income
          </Button>
        </CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-2">No income recorded yet.</p>
              <p className="text-sm text-muted-foreground">Add your salary, bursary, or other income sources.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {incomes.map((income) => {
                const typeInfo = INCOME_TYPES.find(t => t.value === income.type) || INCOME_TYPES[INCOME_TYPES.length - 1]
                const Icon = typeInfo.icon
                return (
                  <div key={income.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${TYPE_COLORS[income.type]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{income.source}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{format(new Date(income.date + "T00:00:00"), "MMM d, yyyy")}</span>
                          {income.recurring && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 border-primary/30 text-primary">Recurring</Badge>
                          )}
                          {income.notes && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{income.notes}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-emerald-500">
                        +${Number(income.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(income)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(income.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? "Edit Income" : "Add Income"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editing ? "Update the income details." : "Record a new income source."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-foreground">Source</Label>
                <Input
                  placeholder="e.g. University of BC Bursary"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  required
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-sm text-foreground"
                >
                  {INCOME_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Notes (optional)</Label>
                <Textarea
                  placeholder="Any additional details..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="bg-input border-border text-foreground resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={form.recurring}
                  onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="recurring" className="text-foreground cursor-pointer">
                  Recurring income (e.g. monthly salary)
                </Label>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{editing ? "Updating..." : "Adding..."}</> : editing ? "Update" : "Add Income"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Income</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this income entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}