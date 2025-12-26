
import fs from "fs";

const envContent = fs.readFileSync(".env", "utf8");
const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

async function listModels() {
    if (!apiKey) return;

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.models) {
            console.log("Modelos disponíveis:");
            data.models.forEach(m => console.log("- " + m.name));
        } else {
            console.log("Nenhum modelo retornado:", JSON.stringify(data));
        }
    } catch (e) {
        console.error("Erro ao listar modelos:", e.message);
    }
}

listModels();
