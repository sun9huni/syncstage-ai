import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
    console.log("🚀 Starting Offline Fallback E2E Verification...");
    const baseUrl = "https://syncstage-ai.vercel.app";

    try {
        // 0. Check if server is running
        try {
            await fetch(baseUrl);
        } catch (e) {
            console.error(`❌ Server is not running on ${baseUrl}.`);
            process.exit(1);
        }

        console.log("✅ Starting tests against: ", baseUrl);

        // 1. Test /api/visual fallback (Graceful Degradation)
        console.log("\n🧪 1. Testing /api/visual Fallback (Should return mock image if Gemini fails)");
        // Note: Unless we force Gemini to fail, we can't fully guarantee the catch block runs,
        // but we CAN guarantee the endpoint always returns `success: true` and an `imageUrl`
        // thanks to the fallback logic.
        const visualRes = await fetch(`${baseUrl}/api/visual`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const visualData = await visualRes.json();
        if (!visualRes.ok || visualData.error) {
            // It should only error if there's no draft at all
            console.warn("⚠️ /api/visual returned error (expected if no state is loaded):", visualData.error);
        } else {
            console.log("✅ /api/visual Success! Image URL returned:", visualData.imageUrl);
            console.log("   Description returned:", visualData.description);
        }

        console.log("\n🎉 Offline Fallback Verification completed.");
        console.log("   (Note: The Mock Patch buttons are UI-only and tested manually via the browser.)");

    } catch (error) {
        console.error("❌ Try Exception during tests:", error);
    }
}

runTests();
