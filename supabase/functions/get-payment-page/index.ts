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
    "שפה"?: string
    "כתובת לעדכון"?: string
    "טקסט לאישור תקנון"?: string
    "קישור לתקנון"?: string
    "תשלום ראשון"?: number
  }
}

// Airtable record ids look like "rec" + 14 alphanumeric chars
const RECORD_ID_PATTERN = /^rec[a-zA-Z0-9]{14}$/
const ALREADY_PAID_STATUS = "שולם לכל השנה"

// "valid" = registration exists, "not_found" = missing/malformed/unknown id,
// "already_paid" = registration is already paid for the whole year,
// "unknown" = lookup failed (don't block the payer because of our own error)
async function checkRegistration(
  userId: unknown,
  pat: string,
  baseId: string
): Promise<"valid" | "not_found" | "already_paid" | "unknown"> {
  if (typeof userId !== "string" || !RECORD_ID_PATTERN.test(userId.trim())) {
    return "not_found"
  }

  try {
    const statusField = "סטטוס רישום לחוג"
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent("הרשמה לניסיון")}/${userId.trim()}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${pat}` } })
    if (res.ok) {
      const record = await res.json()
      return record.fields?.[statusField] === ALREADY_PAID_STATUS ? "already_paid" : "valid"
    }
    if (res.status === 403 || res.status === 404) return "not_found"
    return "unknown"
  } catch {
    return "unknown"
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
    const { recordId, userId } = await req.json()

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

    const userCheck = await checkRegistration(userId, AIRTABLE_PAT, AIRTABLE_BASE_ID)

    return new Response(
      JSON.stringify({
        success: true,
        userCheck,
        data: {
          id: data.id,
          productName: data.fields["שם המוצר"] || "",
          productDescription: data.fields["תיאור המוצר"] || "",
          paymentType: data.fields["סוג תשלום"] || "",
          numPayments: data.fields["כמות תשלומים"] || 1,
          maxPayments: data.fields["כמות תשלומים מקסימלית אשראי בלבד"] || null,
          amount: data.fields["סכום לתשלום"] || 0,
          language: data.fields["שפה"] || "il",
          notifyUrlAddress: data.fields["כתובת לעדכון"] || "",
          termsApprovalText: data.fields["טקסט לאישור תקנון"] || "",
          termsLink: data.fields["קישור לתקנון"] || "",
          firstPayment: data.fields["תשלום ראשון"] || null,
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

