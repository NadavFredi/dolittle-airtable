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

interface HistoryResponse {
  history: Record<string, Record<string, boolean>> // studentId -> { date: attended }
  dates: string[]
  cohortId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { cohortId, date, dateRange } = await req.json()

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

    // Call the webhook to get attendance data
    const webhookUrl = dateRange
      ? "https://hook.eu2.make.com/0e2cyv1hcdgbvcisfh6hk3sc55lqqjai" // History endpoint
      : "https://hook.eu2.make.com/0e2cyv1hcdgbvcisfh6hk3sc55lqqjai" // Single date endpoint

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cohortId,
        date, // optional
        dateRange, // for history: { startDate, endDate }
      }),
    })

    if (!webhookResponse.ok) {
      throw new Error(`Webhook request failed: ${webhookResponse.status}`)
    }

    // Parse the response - might be JSON or text
    if (dateRange) {
      // History response
      try {
        const historyData = await webhookResponse.json()
        return new Response(
          JSON.stringify({
            success: true,
            data: historyData,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        )
      } catch {
        const textResponse = await webhookResponse.text()
        console.log("Webhook returned text:", textResponse)

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              history: {},
              dates: [],
              cohortId,
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        )
      }
    } else {
      // Single date response
      let attendanceData: AttendanceResponse | null = null

      try {
        attendanceData = await webhookResponse.json()
      } catch {
        const textResponse = await webhookResponse.text()
        console.log("Webhook returned text:", textResponse)

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
    }
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
