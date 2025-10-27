import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface AttendanceResponse {
  attendance: Record<string, boolean> // studentId -> attended (boolean)
  date: string
  cohortId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { cohortId, date } = await req.json()

    if (!cohortId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "cohortId is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // For now, since we're just calling the webhook, we don't need Airtable credentials
    // But if you want to store attendance in Airtable, you would need them

    // Call the webhook to get attendance data
    const webhookUrl = "https://hook.eu2.make.com/0e2cyv1hcdgbvcisfh6hk3sc55lqqjai"

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cohortId,
        date, // optional, if not provided returns all attendance for this cohort
      }),
    })

    if (!webhookResponse.ok) {
      throw new Error(`Webhook request failed: ${webhookResponse.status}`)
    }

    // Parse the response - might be JSON or text
    let attendanceData: AttendanceResponse | null = null

    try {
      attendanceData = await webhookResponse.json()
    } catch {
      // If not JSON, try to parse as text
      const textResponse = await webhookResponse.text()
      console.log("Webhook returned text:", textResponse)

      // If it's "Accepted" or similar, return empty attendance
      attendanceData = {
        attendance: {},
        date: date || new Date().toISOString().split("T")[0],
        cohortId,
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: attendanceData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error fetching attendance:", error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
