"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Check, X, FileText, AlertCircle } from "lucide-react"

interface Transaction {
  id: string
  date: string
  description: string
  amount: string
  type: "debit" | "credit"
  categoryId: string
  categoryName: string
  included: boolean
}

interface Category {
  id: string
  name: string
  color: string
}

interface StatementUploaderProps {
  userId: string
  categories: Category[]
}

export function StatementUploader({ userId, categories }: StatementUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState("")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [savedCount, setSavedCount] = useState<number | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && f.type === "application/pdf") {
      setFile(f)
      setTransactions([])
      setSavedCount(null)
      setScanStatus("")
      setError("")
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.type === "application/pdf") {
      setFile(f)
      setTransactions([])
      setSavedCount(null)
      setScanStatus("")
      setError("")
    }
  }, [])

  const handleScan = async () => {
    if (!file) return
    setIsScanning(true)
    setError("")
    setTransactions([])

    try {
      setScanStatus("Reading bank statement...")

      // Convert PDF to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(",")[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      setScanStatus("Extracting and categorizing transactions with AI...")

      const res = await fetch("/api/scan-statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64: base64,
          categories: categories.map(c => ({ id: c.id, name: c.name })),
        }),
      })

      if (!res.ok) throw new Error("Failed to scan statement")

      const data = await res.json()

      const parsed: Transaction[] = (data.transactions || []).map((t: any, i: number) => ({
        id: `txn-${i}`,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        categoryId: t.categoryId || "",
        categoryName: t.categoryName || "",
        included: true,
      }))

      if (parsed.length === 0) throw new Error("No transactions found. Make sure the PDF is a valid bank statement.")

      setTransactions(parsed)
      setScanStatus("")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to process statement. Please try again.")
      setScanStatus("")
    } finally {
      setIsScanning(false)
    }
  }

  const toggleIncluded = (id: string) =>
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, included: !t.included } : t))

  const updateField = (id: string, field: string, value: string) =>
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))

  const updateCategory = (id: string, categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId)
    setTransactions(prev => prev.map(t =>
      t.id === id ? { ...t, categoryId, categoryName: cat?.name || "" } : t
    ))
  }

  const handleSave = async () => {
    const toSave = transactions.filter(t => t.included)
    if (toSave.length === 0) return
    setIsSaving(true)

    const debits = toSave.filter(t => t.type === "debit")
    const credits = toSave.filter(t => t.type === "credit")

    if (debits.length > 0) {
      await supabase.from("expenses").insert(
        debits.map(t => ({
          user_id: userId,
          merchant: t.description,
          amount: parseFloat(t.amount),
          date: t.date,
          category_id: t.categoryId || null,
          notes: "Imported from bank statement",
        }))
      )
    }

    if (credits.length > 0) {
      await supabase.from("incomes").insert(
        credits.map(t => ({
          user_id: userId,
          source: t.description,
          type: "other",
          amount: parseFloat(t.amount),
          date: t.date,
          notes: "Imported from bank statement",
          recurring: false,
        }))
      )
    }

    setSavedCount(toSave.length)
    setIsSaving(false)
    setTransactions([])
    setFile(null)
    router.refresh()
  }

  const includedCount = transactions.filter(t => t.included).length
  const debitCount = transactions.filter(t => t.included && t.type === "debit").length
  const creditCount = transactions.filter(t => t.included && t.type === "credit").length
  const totalDebit = transactions.filter(t => t.included && t.type === "debit").reduce((s, t) => s + parseFloat(t.amount || "0"), 0)
  const totalCredit = transactions.filter(t => t.included && t.type === "credit").reduce((s, t) => s + parseFloat(t.amount || "0"), 0)

  return (
    <div className="space-y-6">
      {/* Upload card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Upload Bank Statement</CardTitle>
          <CardDescription className="text-muted-foreground">
            Upload a PDF bank statement. Gemini AI will extract and categorize all transactions automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!file ? (
            <label
              htmlFor="pdf-upload"
              className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <FileText className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-1">Drag and drop your bank statement here</p>
              <p className="text-xs text-muted-foreground">PDF files only</p>
              <input id="pdf-upload" type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setFile(null); setTransactions([]) }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {file && transactions.length === 0 && (
            <Button className="w-full" onClick={handleScan} disabled={isScanning}>
              {isScanning ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{scanStatus}</>
              ) : (
                <><FileText className="mr-2 h-4 w-4" />Scan Statement</>
              )}
            </Button>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success message */}
      {savedCount !== null && (
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="flex items-center gap-3 pt-6">
            <Check className="h-5 w-5 text-emerald-500" />
            <p className="text-emerald-500 font-medium">
              Successfully imported {savedCount} transaction{savedCount !== 1 ? "s" : ""} to your dashboard!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transaction review table */}
      {transactions.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-foreground">Review Transactions</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  {transactions.length} transactions found. Categories auto-assigned — edit anything before importing.
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs">
                <span className="text-muted-foreground">{includedCount} selected</span>
                {debitCount > 0 && <span className="text-red-400">−${totalDebit.toFixed(2)} expenses</span>}
                {creditCount > 0 && <span className="text-emerald-500">+${totalCredit.toFixed(2)} income</span>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Headers */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-3 text-xs font-medium text-muted-foreground border-b border-border pb-2">
              <span></span>
              <span>Description / Date</span>
              <span>Type</span>
              <span className="text-right">Amount</span>
              <span>Category</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center p-3 rounded-lg transition-colors ${
                    txn.included ? "bg-secondary/50" : "bg-secondary/20 opacity-40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={txn.included}
                    onChange={() => toggleIncluded(txn.id)}
                    className="h-4 w-4 rounded border-border cursor-pointer"
                  />

                  <div className="min-w-0">
                    <input
                      type="text"
                      value={txn.description}
                      onChange={(e) => updateField(txn.id, "description", e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-foreground border-b border-transparent hover:border-border focus:border-primary outline-none"
                    />
                    <p className="text-xs text-muted-foreground mt-0.5">{txn.date}</p>
                  </div>

                  <Badge
                    variant="outline"
                    className={txn.type === "debit"
                      ? "border-red-500/30 text-red-400 text-xs whitespace-nowrap"
                      : "border-emerald-500/30 text-emerald-500 text-xs whitespace-nowrap"
                    }
                  >
                    {txn.type === "debit" ? "Expense" : "Income"}
                  </Badge>

                  <div className="flex items-center gap-0.5">
                    <span className={`text-sm ${txn.type === "debit" ? "text-red-400" : "text-emerald-500"}`}>
                      {txn.type === "debit" ? "−" : "+"}$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={txn.amount}
                      onChange={(e) => updateField(txn.id, "amount", e.target.value)}
                      className="w-20 bg-transparent text-sm font-medium text-foreground border-b border-transparent hover:border-border focus:border-primary outline-none text-right"
                    />
                  </div>

                  {txn.type === "debit" ? (
                    <select
                      value={txn.categoryId}
                      onChange={(e) => updateCategory(txn.id, e.target.value)}
                      className="text-xs bg-input border border-border rounded px-2 py-1 text-foreground max-w-[140px]"
                    >
                      <option value="">No category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-muted-foreground">Income</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setTransactions(prev => prev.map(t => ({ ...t, included: true })))}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTransactions(prev => prev.map(t => ({ ...t, included: false })))}>
                  Deselect All
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setTransactions([]); setFile(null) }}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving || includedCount === 0}>
                  {isSaving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</>
                  ) : (
                    <><Check className="mr-2 h-4 w-4" />Import {includedCount} Transaction{includedCount !== 1 ? "s" : ""}</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
