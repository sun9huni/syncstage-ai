import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = fs.readFileSync(path.join(__dirname, "../.env.local"), "utf8");
const match = envContent.match(/GEMINI_API_KEY2=(.*)/);
const apiKey = match ? match[1].trim() : null;

if (!apiKey) {
    console.error("❌ No GEMINI_API_KEY2 found in .env.local");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function testKey() {
    try {
        console.log("🚀 Testing new Gemini API Key (GEMINI_API_KEY2)...");
        console.log(`Key snippet: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Say 'Hello, API is working!' if you can hear me.",
        });
        console.log("✅ Success! Response:", response.text);
    } catch (error) {
        console.error("❌ Failed. API Key Error:", error.message || error);
    }
}

testKey();
