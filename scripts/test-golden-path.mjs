import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
    console.log("🚀 Testing Golden Path on Vercel...");
    const baseUrl = "https://syncstage-ai.vercel.app";
    const audioPath = path.join(__dirname, '../public/musics/demo_kpop_15s.mp3');

    if (!fs.existsSync(audioPath)) {
        console.error("❌ Audio file not found at:", audioPath);
        process.exit(1);
    }

    console.log(`🎵 Uploading ${path.basename(audioPath)} to /api/draft...`);

    const formData = new FormData();
    const fileBlob = new Blob([fs.readFileSync(audioPath)], { type: 'audio/mpeg' });
    formData.append("file", fileBlob, "demo_kpop_15s.mp3");

    const startTime = Date.now();
    try {
        const draftRes = await fetch(`${baseUrl}/api/draft`, {
            method: "POST",
            body: formData,
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (!draftRes.ok) {
            const errorText = await draftRes.text();
            console.error(`❌ Request Failed after ${duration}s with status ${draftRes.status}`);
            console.error("Response:", errorText);
            return;
        }

        const draftData = await draftRes.json();
        console.log(`✅ Success in ${duration}s! JSON output:`);
        console.dir(draftData, { depth: null, colors: true });

    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`❌ Request Aborted/Failed after ${duration}s:`, error);
    }
}

runTest();
