// Test script to verify Airtable connection
// Run with: npx tsx test-airtable.ts

import { config } from "dotenv"

// Load environment variables from .env.local
config({ path: ".env.local" })

const AIRTABLE_PAT = process.env.AIRTABLE_PAT
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

if (!AIRTABLE_PAT) {
  console.error("❌ AIRTABLE_PAT not found in environment variables")
  process.exit(1)
}

if (!AIRTABLE_BASE_ID) {
  console.error("❌ AIRTABLE_BASE_ID not found in environment variables")
  process.exit(1)
}

async function testAirtableConnection() {
  try {
    console.log("🔍 Testing Airtable connection...")
    console.log("Base ID:", AIRTABLE_BASE_ID)

    // Test 1: Get base metadata
    console.log("\n📊 Testing base metadata...")
    const metadataResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
    })

    if (metadataResponse.ok) {
      const metadata = await metadataResponse.json()
      console.log("✅ Base metadata successful!")
      console.log("Available tables:", metadata.tables?.map((t: any) => t.name) || "No tables found")
    } else {
      console.log("❌ Base metadata failed:", metadataResponse.status, metadataResponse.statusText)
    }

    // Test 2: Try to access הרשמה לניסיון table
    console.log("\n📋 Testing הרשמה לניסיון table...")
    const registrationsResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/הרשמה לניסיון`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
    })

    if (registrationsResponse.ok) {
      const data = await registrationsResponse.json()
      console.log("✅ הרשמה לניסיון table successful!")
      console.log("Records found:", data.records?.length || 0)
    } else {
      console.log("❌ הרשמה לניסיון table failed:", registrationsResponse.status, registrationsResponse.statusText)
    }
  } catch (error) {
    console.error("❌ Error:", error)
  }
}

testAirtableConnection()
