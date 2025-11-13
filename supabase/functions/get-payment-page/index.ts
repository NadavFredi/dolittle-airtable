import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface PaymentPageRecord {
  id: string
  fields: {
    "שם המוצר"?: string
    "סוג תשלום"?: string
    "כמות תשלומים"?: number
    "כמות תשלומים מקסימלית"?: number
    "סכום לתשלום"?: number
    "שפה"?: string
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

    // Get record ID from request body
    const { recordId } = await req.json()

    if (!recordId) {
      return new Response(
        JSON.stringify({ error: "recordId parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Fetch the specific record from Airtable
    const tableName = "דפי תשלום מותאם אישית"
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`

    const response = await fetch(airtableUrl, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: "Payment page record not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      }
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
    }

    const data: PaymentPageRecord = await response.json()

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          productName: data.fields["שם המוצר"] || "",
          paymentType: data.fields["סוג תשלום"] || "",
          numPayments: data.fields["כמות תשלומים"] || 1,
          maxPayments: data.fields["כמות תשלומים מקסימלית"] || null,
          amount: data.fields["סכום לתשלום"] || 0,
          language: data.fields["שפה"] || "il",
          notifyUrlAddress: data.fields["כתובת לעדכון"] || "",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch payment page data" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})

