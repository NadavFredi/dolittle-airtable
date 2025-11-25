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

    console.log("Received POST data:", postData)

    // Use URLSearchParams for application/x-www-form-urlencoded
    const formData = new URLSearchParams()

    // Add directcgi (required for Tranzila)
    formData.append("directcgi", "on")

    // Add supplier (hardcoded as requested)
    formData.append("supplier", "calbnoot")

    // Add all fields from postData
    for (const [key, value] of Object.entries(postData)) {
      if (value !== null && value !== undefined && value !== "") {
        // For json_purchase_data, URL-encode it if it's a JSON string
        if (key === "json_purchase_data" && typeof value === "string") {
          formData.append(key, encodeURIComponent(value))
        } else {
          formData.append(key, String(value))
        }
      }
    }

    // Log the form data entries and equivalent curl command
    console.log("Form data entries:")
    const curlFormFields: string[] = []
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`)
      // Escape single quotes and build curl --data-urlencode flag
      const escapedValue = String(value).replace(/'/g, "'\\''")
      curlFormFields.push(`  --data-urlencode '${key}=${escapedValue}'`)
    }

    const curlCommand = `curl --location 'https://direct.tranzila.com/calbnoot/iframenew.php' \\\n  --header 'Content-Type: application/x-www-form-urlencoded' \\\n  --header 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \\\n${curlFormFields.join(
      " \\\n"
    )}`
    console.log("\nEquivalent curl command:\n", curlCommand)

    // Make POST request to Tranzila iframe endpoint with URL-encoded form data
    const response = await fetch("https://direct.tranzila.com/calbnoot/iframenew.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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
