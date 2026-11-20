
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const apiKey = process.env.GEMINI_API_KEY?.trim();

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const instructions = {
  chat: "You are StudyMate, a friendly AI study assistant. Explain clearly with examples.",
  explain: "Explain the topic to a beginner. Include an analogy, key points and an example.",
  summarize: "Summarize these study notes into an overview, key points and important terms. Do not invent facts.",
  quiz: "Create 5 multiple-choice questions with options A-D. Give the answer key and brief explanations at the end."
};

app.get("/api/status", (_req, res) => {
  res.json({ configured: Boolean(apiKey) });
});

app.post("/api/ask", async (req, res) => {
  try {
    const { message, mode = "chat" } = req.body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please enter a question or some notes."
      });
    }

    if (message.length > 12000) {
      return res.status(413).json({
        error: "Please keep your input under 12,000 characters."
      });
    }

    if (!ai) {
      return res.status(503).json({
        error: "API key missing. Add GEMINI_API_KEY to your .env file."
      });
    }

    const prompt = instructions[mode] || instructions.chat;

    // Use the standard Gemini text-generation method.
    let response;

for (let attempt = 0; attempt < 3; attempt++) {
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `${prompt}\n\nStudent request: ${message}`
    });

    break;

  } catch (error) {
    const status = error.status || error.code;

    if (status !== 503 || attempt === 2) {
      throw error;
    }

    console.log(`Gemini busy. Retrying in ${2 ** attempt} seconds...`);

    await new Promise(resolve =>
      setTimeout(resolve, 1000 * (2 ** attempt))
    );
  }
}

const answer = response.text;

    if (!answer) {
      console.error("Gemini returned an empty response.");
      return res.status(502).json({
        error: "The AI returned no answer. Please try again."
      });
    }

    res.json({ answer });
  } catch (error) {
    // Show the actual problem in the VS Code terminal.
    
    console.error("Gemini API Error:", error);
    console.error("Error message:", error.message);
    console.error("HTTP status:", error.status);

    res.status(500).json({
      error: error.message || "AI request failed."
    });
}
});

app.listen(PORT, () => {
  console.log(`StudyMate running at http://localhost:${PORT}`);

  if (!apiKey) {
    console.log("Warning: GEMINI_API_KEY is missing from .env");
  }
});
