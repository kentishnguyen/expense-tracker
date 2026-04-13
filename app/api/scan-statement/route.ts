import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64, categories } = await req.json()

    if (!pdfBase64) {
      return NextResponse.json({ error: "No PDF data provided" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    const categoryList = (categories || [])
      .map((c: { id: string; name: string }) => `- id: "${c.id}", name: "${c.name}"`)
      .join("\n")

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
                  inline_data: {
                    mime_type: "application/pdf",
                    data: pdfBase64,
                  },
                },
                {
                  text: `You are a bank statement parser. Extract every transaction from this bank statement PDF and categorize each one.

Available categories:
${categoryList || "No categories provided"}

Respond ONLY with a valid JSON array — no markdown, no explanation, no extra text.

Format:
[
  {
    "date": "YYYY-MM-DD",
    "description": "cleaned merchant or payee name",
    "amount": "12.50",
    "type": "debit",
    "categoryId": "matching category id from the list above",
    "categoryName": "matching category name"
  }
]

Rules:
- "type" is "debit" if money left the account, "credit" if money came in
- "amount" is always a positive decimal string, no currency symbols
- "date" must be YYYY-MM-DD. Infer the year from the statement or use ${new Date().getFullYear()}
- "description" should be the clean merchant/payee name — strip transaction codes and noise
- For "categoryId" and "categoryName": pick the best matching category. If nothing fits or it's a credit, use "" for both
- Include ALL transactions: purchases, fees, refunds, transfers, deposits
- Return [] if no transactions found`,
                },
              ],
            },
          ],
        }),
      }
    )

    const data = await response.json()

    // Log the full Gemini response for debugging
    console.log("Gemini status:", response.status)
    console.log("Gemini full response:", JSON.stringify(data, null, 2))

    // Check for Gemini API errors
    if (data.error) {
      console.error("Gemini API error:", data.error)
      return NextResponse.json(
        { error: `Gemini error: ${data.error.message || JSON.stringify(data.error)}` },
        { status: 500 }
      )
    }

    // Check for blocked content
    const candidate = data.candidates?.[0]
    if (!candidate) {
      console.error("No candidates returned. Prompt feedback:", data.promptFeedback)
      return NextResponse.json(
        { error: `No response from Gemini. Reason: ${data.promptFeedback?.blockReason || "unknown"}` },
        { status: 500 }
      )
    }

    // Check finish reason
    if (candidate.finishReason && candidate.finishReason !== "STOP") {
      console.error("Unexpected finish reason:", candidate.finishReason)
      return NextResponse.json(
        { error: `Gemini stopped early: ${candidate.finishReason}` },
        { status: 500 }
      )
    }

    const text = candidate.content?.parts?.[0]?.text || "[]"
    console.log("Raw text from Gemini:", text.slice(0, 500))

    const clean = text.replace(/```json|```/g, "").trim()

    let transactions
    try {
      transactions = JSON.parse(clean)
    } catch (parseErr) {
      console.error("JSON parse failed. Raw text was:", text)
      return NextResponse.json(
        { error: "Gemini returned invalid JSON. Check server logs." },
        { status: 500 }
      )
    }

    return NextResponse.json({ transactions })
  } catch (err) {
    console.error("Statement scan error:", err)
    return NextResponse.json({ error: "Failed to parse bank statement" }, { status: 500 })
  }
}
