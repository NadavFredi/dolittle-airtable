import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { cohortId, cohortName, date, arrivals } = await req.json()

    // Validate required fields
    if (!cohortId || !cohortName || !date || !arrivals || !Array.isArray(arrivals)) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: cohortId, cohortName, date, and arrivals are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Prepare the payload for the Make.com webhook
    const webhookPayload = {
      cohortId,
      cohortName,
      date,
      arrivals,
      timestamp: new Date().toISOString(),
    }

    console.log("Sending attendance to webhook:", { cohortId, cohortName, date, arrivalCount: arrivals.length })

    // Send to Make.com webhook
    const webhookResponse = await fetch("https://hook.eu2.make.com/6luhtuffr5m49cnoronku4fnv7g7wlyr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      throw new Error(`Webhook request failed: ${webhookResponse.status} - ${errorText}`)
    }

    // Handle the response - it might return plain text or JSON
    const contentType = webhookResponse.headers.get("content-type")
    let webhookResult
    if (contentType && contentType.includes("application/json")) {
      webhookResult = await webhookResponse.json()
    } else {
      webhookResult = await webhookResponse.text()
    }

    console.log("Webhook response:", webhookResult)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Attendance saved successfully for ${arrivals.length} students`,
        result: webhookResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error in send-attendance:", error)

    return new Response(
      JSON.stringify({
        error: "Failed to send attendance",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
