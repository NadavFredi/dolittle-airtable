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
    // Hardcoded Tranzila credentials
    const TRANZILA_PW = "z1o2oEjq"
    const TRANZILA_SUPPLIER = "calbnoot"

    // Get sum from request body
    const { sum } = await req.json()

    if (!sum && sum !== 0) {
      return new Response(
        JSON.stringify({ error: "sum parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Call Tranzila handshake API
    const handshakeUrl = `https://api.tranzila.com/v1/handshake/create?supplier=${TRANZILA_SUPPLIER}&sum=${sum}&TranzilaPW=${TRANZILA_PW}`

    const response = await fetch(handshakeUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Tranzila API error: ${response.status} ${response.statusText}`)
    }

    // Parse the response - it returns plain text like "thtk=token"
    const responseText = await response.text()
    
    // Extract the thtk value
    const thtkMatch = responseText.match(/thtk=([^\s]+)/)
    
    if (!thtkMatch || !thtkMatch[1]) {
      throw new Error("Failed to extract thtk token from Tranzila response")
    }

    const thtk = thtkMatch[1]

    return new Response(
      JSON.stringify({
        success: true,
        thtk: thtk,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create Tranzila handshake" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})

