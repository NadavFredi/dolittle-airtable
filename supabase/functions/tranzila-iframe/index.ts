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
    // Get POST data from request body
    const postData = await req.json()

    if (!postData) {
      return new Response(JSON.stringify({ error: "POST data is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log(postData)

    // Convert postData to FormData (multipart/form-data)
    const formData = new FormData()
    for (const [key, value] of Object.entries(postData)) {
      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, String(value))
      }
    }

    // Log the form data entries
    console.log("Form data entries:")
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`)
    }

    // Make POST request to Tranzila iframe endpoint with FormData
    // Note: Don't set Content-Type header manually - FormData will set it with boundary
    const response = await fetch("https://directng.tranzila.com/calbnoot/iframenew.php", {
      method: "POST",
      headers: {
        Accept: "text/html, application/xhtml+xml",
        // FormData will automatically set Content-Type: multipart/form-data; boundary=...
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Tranzila API error: ${response.status} ${response.statusText}`)
    }

    // Get the HTML content
    const htmlContent = await response.text()

    // Return the HTML content as JSON (since supabase.functions.invoke expects JSON)
    return new Response(
      JSON.stringify({
        success: true,
        html: htmlContent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Failed to load Tranzila iframe" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
