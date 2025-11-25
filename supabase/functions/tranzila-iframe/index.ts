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
    // Use hardcoded values matching the working curl example
    const jsonPurchaseData =
      '[{"product_name":"product","product_quantity":1,"product_price":1},{"product_name":"product2","product_quantity":1,"product_price":1},{"product_name":"product3","product_quantity":1,"product_price":1},{"product_name":"product4","product_quantity":1,"product_price":1},{"product_name":"product5","product_quantity":1,"product_price":1}]'

    // Use URLSearchParams for application/x-www-form-urlencoded
    const formData = new URLSearchParams()
    formData.append("directcgi", "on")
    formData.append("supplier", "calbnoot")
    formData.append("sum", "10")
    formData.append("currency", "1")
    formData.append("json_purchase_data", encodeURIComponent(jsonPurchaseData))
    formData.append("cred_type", "8")
    formData.append("maxpay", "4")
    formData.append("u71", "1")

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
