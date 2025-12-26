
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

// Read .env manually
const envContent = fs.readFileSync(".env", "utf8");
const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

async function test() {
    if (!apiKey) {
        console.error("ERRO: VITE_GEMINI_API_KEY não encontrada no .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const models = ["gemini-1.5-flash", "gemini-1.5-pro"];
    const versions = ["v1", "v1beta"];

    for (const v of versions) {
        for (const m of models) {
            try {
                console.log(`Tentando modelo: ${m} na versão ${v}...`);
                const model = genAI.getGenerativeModel({ model: m }, { apiVersion: v });
                const result = await model.generateContent("Diga oi");
                const response = await result.response;
                console.log(`SUCESSO with ${m} on ${v}:`, response.text());
                return;
            } catch (e) {
                console.error(`FALHA with ${m} on ${v}:`, e.message);
            }
        }
    }
}

test();
