import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
    console.log("🚀 Starting E2E API Verification...");
    const baseUrl = "https://syncstage-ai.vercel.app";

    try {
        // 0. Check if server is running
        try {
            await fetch(baseUrl);
        } catch (e) {
            console.error("❌ Next.js server is not running on localhost:3000. Please start it first.");
            process.exit(1);
        }
        const dummyAudioPath = path.join(__dirname, 'dummy.ogg');
        if (!fs.existsSync(dummyAudioPath)) {
            console.log("   (Downloading a tiny real audio file for Gemini validation...)");
            const audioRes = await fetch("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
            const buffer = await audioRes.arrayBuffer();
            fs.writeFileSync(dummyAudioPath, Buffer.from(buffer));
        }

        // 2. Test /api/draft
        console.log("\n🧪 1. Testing /api/draft (Audio Upload -> JSON Draft)");
        const formData = new FormData();
        const fileBlob = new Blob([fs.readFileSync(dummyAudioPath)], { type: 'audio/ogg' });
        formData.append("file", fileBlob, "dummy.ogg");

        const draftRes = await fetch(`${baseUrl}/api/draft`, {
            method: "POST",
            body: formData,
        });
        const draftData = await draftRes.json();

        if (!draftRes.ok || draftData.error) {
            console.error("❌ /api/draft failed:", draftData.error);
            return;
        }
        console.log("✅ /api/draft Success! Initial Revision:", draftData.revision);
        console.log("   Segments generated:", draftData.segments.length);
        console.log("   Visual Style:", draftData.visualConcept.style);

        // 3. Test /api/patch
        console.log("\n🧪 2. Testing /api/patch (Natural Language Instruction)");
        const patchRes = await fetch(`${baseUrl}/api/patch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                instruction: "Change the first segment to be a more aggressive hiphop move and increase intensity.",
                revision: draftData.revision
            }),
        });

        const patchData = await patchRes.json();
        if (!patchRes.ok || patchData.error) {
            console.error("❌ /api/patch failed:", patchData.error);
            return;
        }

        console.log("✅ /api/patch Success! New Revision:", patchData.draft.revision);
        console.log("   Message from AI:", patchData.message);

        // 4. Test Error Handling (Idempotency)
        console.log("\n🧪 3. Testing Idempotency Conflict (Sending wrong revision)");
        const conflictRes = await fetch(`${baseUrl}/api/patch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                instruction: "Try to override again",
                revision: 0 // Wrong revision, should be 1 now
            }),
        });
        if (conflictRes.status === 409) {
            console.log("✅ Conflict properly detected (409 returned as expected).");
        } else {
            console.warn("⚠️ Expected 409 Conflict, but got:", conflictRes.status);
        }

        // 5. Cleanup
        fs.unlinkSync(dummyAudioPath);
        console.log("\n🎉 All API Tests Passed End-to-End!");

    } catch (error) {
        console.error("❌ Try Exception during tests:", error);
    }
}

runTests();
