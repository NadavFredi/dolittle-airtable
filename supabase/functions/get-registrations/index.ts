import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface RegistrationRecord {
  id: string
  fields: {
    "שם הילד"?: string
    מחזור?: string
    "טלפון הורה"?: string
    "שם מלא הורה"?: string
    חוג?: string
    "בית ספר"?: string
    כיתה?: string
    "האם צריך איסוף מהצהרון"?: boolean
    "תאריך הגעה לשיעור ניסיון"?: string
    "האם בקבוצת הוואטסאפ"?: boolean
    "סטטוס רישום לחוג"?: string
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

    // Fetch data from Airtable
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/הרשמה לניסיון`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Transform the data to match our UI structure
    const registrations = data.records.map((record: RegistrationRecord) => ({
      id: record.id,
      childName: record.fields["שם הילד"] || "",
      cycle: record.fields["מחזור"] || "",
      parentPhone: record.fields["טלפון הורה"] || "",
      parentName: record.fields["שם מלא הורה"] || "",
      course: record.fields["חוג"] || "",
      school: record.fields["בית ספר"] || "",
      class: record.fields["כיתה"] || "",
      needsPickup: record.fields["האם צריך איסוף מהצהרון"] || false,
      trialDate: record.fields["תאריך הגעה לשיעור ניסיון"] || "",
      inWhatsAppGroup: record.fields["האם בקבוצת הוואטסאפ"] || false,
      registrationStatus: record.fields["סטטוס רישום לחוג"] || "",
    }))

    return new Response(
      JSON.stringify({
        success: true,
        data: registrations,
        total: registrations.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error fetching registrations:", error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    )
  }
})
