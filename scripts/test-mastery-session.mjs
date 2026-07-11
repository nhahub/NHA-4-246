// Temporary test script: login → JWT → call getMasterySession
const SUPABASE_URL = "http://127.0.0.1:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const TEST_EMAIL = "marwaselim880@gmail.com";
const TEST_PASSWORD = "01006249231";

async function main() {
  console.log("1. Signing in as", TEST_EMAIL);

  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });

  const loginData = await loginRes.json();

  if (!loginRes.ok || !loginData.access_token) {
    console.error("Login failed:", JSON.stringify(loginData, null, 2));
    process.exit(1);
  }

  const jwt = loginData.access_token;
  console.log("   JWT obtained (first 40 chars):", jwt.slice(0, 40) + "...");

  console.log("\n2. Calling getMasterySession edge function...");

  const fnRes = await fetch(`${SUPABASE_URL}/functions/v1/getMasterySession`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({}),
  });

  const fnData = await fnRes.json();

  console.log("   HTTP status:", fnRes.status);
  console.log("   Response:\n", JSON.stringify(fnData, null, 2));

  if (fnRes.ok && fnData.queue !== undefined) {
    console.log("\nSUCCESS: getMasterySession returned a queue with", fnData.totalToday, "item(s).");
  } else {
    console.error("\nFAILURE: Unexpected response.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
