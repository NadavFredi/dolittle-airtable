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

    // Fetch registrations data
    const registrationsResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/הרשמה לניסיון`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
    })

    if (!registrationsResponse.ok) {
      throw new Error(`Airtable API error: ${registrationsResponse.status} ${registrationsResponse.statusText}`)
    }

    const registrationsData = await registrationsResponse.json()

    // Fetch lookup tables
    const [schoolsResponse, cyclesResponse, coursesResponse] = await Promise.all([
      fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/בתי ספר`, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
          "Content-Type": "application/json",
        },
      }),
      fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/מחזורים`, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
          "Content-Type": "application/json",
        },
      }),
      fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/חוגים`, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
          "Content-Type": "application/json",
        },
      }),
    ])

    // Parse lookup data
    const schoolsData = schoolsResponse.ok ? await schoolsResponse.json() : { records: [] }
    const cyclesData = cyclesResponse.ok ? await cyclesResponse.json() : { records: [] }
    const coursesData = coursesResponse.ok ? await coursesResponse.json() : { records: [] }

    // Create lookup maps using record.id as the key and display names as values
    const schoolMap = new Map()
    schoolsData.records.forEach((record: any) => {
      const schoolName = record.fields["בית ספר"]
      if (record.id && schoolName) {
        schoolMap.set(record.id, schoolName)
      }
    })

    const cycleMap = new Map()
    cyclesData.records.forEach((record: any) => {
      const cycleName = record.fields["שם מחזור לתצוגה"]
      if (record.id && cycleName) {
        cycleMap.set(record.id, cycleName)
      }
    })

    const courseMap = new Map()
    coursesData.records.forEach((record: any) => {
      const courseName = record.fields["שם החוג"]
      if (record.id && courseName) {
        courseMap.set(record.id, courseName)
      }
    })

    // Transform the data to match our UI structure
    const registrations = registrationsData.records.map((record: RegistrationRecord) => {
      // Helper function to get the first value from an array or return the value itself
      const getFirstValue = (value: any) => {
        if (Array.isArray(value)) {
          return value[0] || ""
        }
        return value || ""
      }

      // Get the actual IDs from the registration record
      const cycleId = getFirstValue(record.fields["מחזור"])
      const courseId = getFirstValue(record.fields["חוג"])
      const schoolId = getFirstValue(record.fields["בית ספר"])

      return {
        id: record.id,
        childName: getFirstValue(record.fields["שם הילד"]),
        cycle: cycleMap.get(cycleId) || cycleId,
        parentPhone: record.fields["טלפון הורה"] || "",
        parentName: record.fields["שם מלא הורה"] || "",
        course: courseMap.get(courseId) || courseId,
        school: schoolMap.get(schoolId) || schoolId,
        class: record.fields["כיתה"] || "",
        needsPickup: record.fields["האם צריך איסוף מהצהרון"] || false,
        trialDate: record.fields["תאריך הגעה לשיעור ניסיון"] || "",
        inWhatsAppGroup: record.fields["האם בקבוצת הוואטסאפ"] || false,
        registrationStatus: record.fields["סטטוס רישום לחוג"] || "",
      }
    })

    // Get unique values for filters
    const filterOptions = {
      schools: Array.from(schoolMap.values()).filter(Boolean),
      cycles: Array.from(cycleMap.values()).filter(Boolean),
      courses: Array.from(courseMap.values()).filter(Boolean),
      classes: [...new Set(registrations.map((r) => r.class))].filter(Boolean),
      registrationStatuses: [...new Set(registrations.map((r) => r.registrationStatus))].filter(Boolean),
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: registrations,
        total: registrations.length,
        filterOptions: filterOptions,
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
