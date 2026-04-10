"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { CategoryForm } from "./category-form"

interface Profile {
  id: string
  name: string | null
  email: string | null
  monthly_budget: number | null
}

interface Category {
  id: string
  name: string
  color: string
  budget_limit: number
}

interface SettingsContentProps {
  profile: Profile | null
  categories: Category[]
  userId: string
  userEmail: string
}

export function SettingsContent({
  profile,
  categories,
  userId,
  userEmail,
}: SettingsContentProps) {
  const [name, setName] = useState(profile?.name || "")
  const [monthlyBudget, setMonthlyBudget] = useState(profile?.monthly_budget?.toString() || "")
  const [isSaving, setIsSaving] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    await supabase.from("profiles").upsert({
      id: userId,
      name,
      email: userEmail,
      monthly_budget: parseFloat(monthlyBudget) || 0,
    })
    setIsSaving(false)
    router.refresh()
  }

  async function handleDeleteCategory() {
    if (!deleteId) return
    await supabase.from("categories").delete().eq("id", deleteId)
    setDeleteId(null)
    router.refresh()
  }

  function handleEditCategory(category: Category) {
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  function handleCloseForm() {
    setShowCategoryForm(false)
    setEditingCategory(null)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Profile</CardTitle>
          <CardDescription className="text-muted-foreground">
            Update your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="bg-input border-border text-foreground max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                value={userEmail}
                disabled
                className="bg-input border-border text-muted-foreground max-w-md"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_budget" className="text-foreground">Monthly Budget ($)</Label>
              <Input
                id="monthly_budget"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 2000.00"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="bg-input border-border text-foreground max-w-md"
              />
              <p className="text-xs text-muted-foreground">Set your overall monthly spending limit.</p>
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Categories</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your expense categories and budgets.
            </CardDescription>
          </div>
          <Button onClick={() => setShowCategoryForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No categories yet. Add your first category!
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                    <div>
                      <p className="font-medium text-foreground">{category.name}</p>
                      {category.budget_limit > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Budget: ${Number(category.budget_limit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(category.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryForm
        open={showCategoryForm}
        onOpenChange={handleCloseForm}
        category={editingCategory}
        userId={userId}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this category? Expenses in this category will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
