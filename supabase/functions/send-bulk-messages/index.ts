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
    const { registrations, totalUsers, uniqueNumbers, messagingMode, flowId } = await req.json()

    // Validate required fields
    if (!registrations || !Array.isArray(registrations)) {
      return new Response(JSON.stringify({ error: "Registrations data is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Prepare the payload for the Make.com webhook
    const webhookPayload = {
      registrations,
      totalUsers,
      uniqueNumbers,
      messagingMode,
      flowId: messagingMode === "formal" ? flowId : undefined,
      timestamp: new Date().toISOString(),
    }

    // Send to Make.com webhook
    const webhookResponse = await fetch("https://hook.eu2.make.com/pdvxq3rh5t1zb054fyyzgiw3ade6gvrb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    })

    if (!webhookResponse.ok) {
      throw new Error(`Webhook request failed: ${webhookResponse.status}`)
    }

    const webhookResult = await webhookResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        message: `Messages sent successfully to ${uniqueNumbers} unique numbers`,
        result: webhookResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error in send-bulk-messages:", error)

    return new Response(
      JSON.stringify({
        error: "Failed to send bulk messages",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
