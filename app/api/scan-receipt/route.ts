import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { ocrText } = await req.json()

    if (!ocrText || !ocrText.trim()) {
      return NextResponse.json({ error: "No OCR text provided" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    console.log("OCR text received:", ocrText)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a receipt parser. I have extracted the following raw text from a receipt using OCR:

---
${ocrText}
---

From this text, extract the following fields and respond ONLY with a valid JSON object — no markdown, no explanation, no extra text.

Format:
{
  "merchant": "the store or restaurant name",
  "amount": "the final total amount as a decimal string (e.g. 12.50)",
  "date": "the date in YYYY-MM-DD format"
}

Rules:
- For "amount", look for keywords like TOTAL, AMOUNT DUE, GRAND TOTAL. Use the final total, not subtotals or tax lines.
- For "date", look for a purchase date. If not found, use today: ${new Date().toISOString().split("T")[0]}.
- For "merchant", use the business name at the top of the receipt.
- If a field cannot be determined, use "" for text fields or "0.00" for amount.`,
                },
              ],
            },
          ],
        }),
      }
    )

    const data = await response.json()
    console.log("Gemini response:", JSON.stringify(data, null, 2))

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    const clean = text.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Receipt scan error:", err)
    return NextResponse.json({ error: "Failed to parse receipt" }, { status: 500 })
  }
}