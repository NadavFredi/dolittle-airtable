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

    // Convert postData to URL-encoded form data
    const formData = new URLSearchParams()
    for (const [key, value] of Object.entries(postData)) {
      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, String(value))
      }
    }

    const formDataString = formData.toString()

    // Log equivalent curl command
    const curlCommand = `curl --location 'https://directng.tranzila.com/calbnoot/iframenew.php' \\\n  --header 'Content-Type: application/x-www-form-urlencoded' \\\n  --header 'Accept: text/html, application/xhtml+xml' \\\n  --data-raw '${formDataString.replace(
      /'/g,
      "'\\''"
    )}'`
    console.log("Equivalent curl command:\n", curlCommand)
    console.log("Form data string:", formDataString)

    // Make POST request to Tranzila iframe endpoint with form data
    const response = await fetch("https://directng.tranzila.com/calbnoot/iframenew.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "text/html, application/xhtml+xml",
      },
      body: formData.toString(),
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
