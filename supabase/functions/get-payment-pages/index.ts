import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface PaymentPageRecord {
  id: string
  fields: {
    "שם המוצר"?: string
    "תיאור המוצר"?: string
    "סוג תשלום"?: string
    "כמות תשלומים"?: number
    "כמות תשלומים מקסימלית אשראי בלבד"?: number
    "סכום לתשלום"?: number
    שפה?: string
    "כתובת לעדכון"?: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Get Airtable PAT from environment
    const AIRTABLE_PAT = Deno.env.get("AIRTABLE_PAT")
    const AIRTABLE_BASE_ID = Deno.env.get("AIRTABLE_BASE_ID")

    if (!AIRTABLE_PAT) {
      throw new Error("AIRTABLE_PAT environment variable is not set")
    }

    if (!AIRTABLE_BASE_ID) {
      throw new Error("AIRTABLE_BASE_ID environment variable is not set")
    }

    // Get search query from request (optional)
    const { search } = await req.json().catch(() => ({ search: "" }))
    const searchQuery = search || ""

    // Fetch all payment pages from Airtable with pagination
    const tableName = "דפי תשלום מותאם אישית"
    const allPaymentPages: PaymentPageRecord[] = []
    let offset: string | undefined = undefined

    while (true) {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}${
        offset ? `?offset=${offset}` : ""
      }`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      allPaymentPages.push(...data.records)

      // Check if there are more records
      if (data.offset) {
        offset = data.offset
      } else {
        break // No more records
      }
    }

    // Filter by search query if provided (search in product name)
    let filteredPages = allPaymentPages
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      filteredPages = allPaymentPages.filter((page) => {
        const productName = page.fields["שם המוצר"] || ""
        return productName.toLowerCase().includes(searchLower)
      })
    }

    // Transform to simple format for autocomplete
    const paymentPages = filteredPages.map((page) => ({
      id: page.id,
      name: page.fields["שם המוצר"] || "ללא שם",
      amount: page.fields["סכום לתשלום"] || 0,
      paymentType: page.fields["סוג תשלום"] || "",
    }))

    return new Response(
      JSON.stringify({
        success: true,
        data: paymentPages,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Failed to fetch payment pages" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
