"use client"
 
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Image as ImageIcon, Loader2, Check, X, ScanText } from "lucide-react"
import useSWR from "swr"
 
interface ParsedData {
  merchant: string
  amount: string
  date: string
}
 
export default function ScannerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [scanStatus, setScanStatus] = useState<string>("")
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [categoryId, setCategoryId] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()
 
  const { data: categories } = useSWR("categories", async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data } = await supabase
      .from("categories")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name")
    return data || []
  })
 
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setParsedData(null)
      setScanStatus("")
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(selectedFile)
    }
  }, [])
 
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile)
      setParsedData(null)
      setScanStatus("")
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(droppedFile)
    }
  }, [])
 
  const handleScan = async () => {
    if (!file) return
    setIsUploading(true)
    setParsedData(null)
 
    try {
      // Step 1: Tesseract.js OCR in the browser
      setScanStatus("Reading text from receipt...")
      const { createWorker } = await import("tesseract.js")
      const worker = await createWorker("eng")
      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()
 
      console.log("OCR extracted text:", text)
 
      if (!text.trim()) throw new Error("No text found in image")
 
      // Step 2: Send raw text to Gemini to structure it
      setScanStatus("Extracting details with AI...")
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText: text }),
      })
 
      if (!res.ok) throw new Error("Gemini parsing failed")
 
      const data = await res.json()
      setParsedData({
        merchant: data.merchant || "",
        amount: data.amount || "0.00",
        date: data.date || new Date().toISOString().split("T")[0],
      })
      setScanStatus("")
    } catch (err) {
      console.error("Scan error:", err)
      setScanStatus("Could not extract details — please fill in manually.")
      setParsedData({
        merchant: "",
        amount: "0.00",
        date: new Date().toISOString().split("T")[0],
      })
    } finally {
      setIsUploading(false)
    }
  }
 
  const handleSave = async () => {
    if (!parsedData) return
    setIsSaving(true)
 
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSaving(false)
      return
    }
 
    await supabase.from("expenses").insert({
      user_id: user.id,
      merchant: parsedData.merchant,
      amount: parseFloat(parsedData.amount),
      date: parsedData.date,
      category_id: categoryId || null,
    })
 
    setIsSaving(false)
    setFile(null)
    setPreview(null)
    setParsedData(null)
    setCategoryId("")
    router.push("/dashboard/expenses")
  }
 
  const handleClear = () => {
    setFile(null)
    setPreview(null)
    setParsedData(null)
    setCategoryId("")
    setScanStatus("")
  }
 
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Receipt Scanner</h1>
        <p className="text-muted-foreground">
          Upload a receipt image to automatically extract expense details.
        </p>
      </div>
 
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Upload Receipt</CardTitle>
            <CardDescription className="text-muted-foreground">
              Drag and drop or click to upload a receipt image
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!preview ? (
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop your receipt here
                </p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative h-64 bg-secondary rounded-lg overflow-hidden">
                  <img src={preview} alt="Receipt preview" className="w-full h-full object-contain" />
                </div>
                <div className="flex gap-2">
                  {!parsedData && (
                    <Button className="flex-1" onClick={handleScan} disabled={isUploading}>
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {scanStatus || "Scanning..."}
                        </>
                      ) : (
                        <>
                          <ScanText className="mr-2 h-4 w-4" />
                          Scan Receipt
                        </>
                      )}
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleClear}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {scanStatus && !isUploading && (
                  <p className="text-xs text-muted-foreground">{scanStatus}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
 
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Extracted Details</CardTitle>
            <CardDescription className="text-muted-foreground">
              Review and edit the extracted information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!parsedData ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Upload and scan a receipt to see extracted details
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="merchant" className="text-foreground">Merchant</Label>
                  <Input
                    id="merchant"
                    value={parsedData.merchant}
                    onChange={(e) => setParsedData({ ...parsedData, merchant: e.target.value })}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-foreground">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={parsedData.amount}
                    onChange={(e) => setParsedData({ ...parsedData, amount: e.target.value })}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-foreground">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={parsedData.date}
                    onChange={(e) => setParsedData({ ...parsedData, date: e.target.value })}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-foreground">Category</Label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-sm text-foreground"
                  >
                    <option value="">Select a category</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Expense
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}