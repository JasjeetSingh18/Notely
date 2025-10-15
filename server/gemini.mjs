import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

// Defensive: ensure an API key is provided
if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "GEMINI_API_KEY is not set. AI requests will fail until the environment variable is provided."
  );
}

let ai;
try {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} catch (err) {
  console.error(
    "Failed to initialize GoogleGenAI client:",
    err?.message || err
  );
  // keep ai undefined — callers will throw a clearer error
}

async function ensureClient() {
  if (!ai)
    throw new Error(
      "AI client not initialized (missing GEMINI_API_KEY or bad configuration)"
    );
  return ai;
}

export async function promptAI(prompt) {
  try {
    const aiClient = await ensureClient();
    const responseChunks = [];

    const streamResp = await aiClient.models.generateContentStream({
      model: "gemini-2.5-flash-lite", // change model if needed
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    for await (const chunk of streamResp) {
      if (chunk.text) responseChunks.push(chunk.text);
    }

    return responseChunks.join("");
  } catch (err) {
    console.error("promptAI error:", err?.message || err);
    throw new Error("AI prompt failed: " + (err?.message || String(err)));
  }
}

export async function enhancePrompt(highlight) {
  if (!highlight) throw new Error("Highlight is required");
  try {
    const aiClient = await ensureClient();

    const systemInstruction = `
You are an AI assistant specialized in enhancing user notes.
Your task is to improve only the highlighted text provided by the user.
Enhancements should be minimal:
- Fix grammar, punctuation, and spelling.
- Improve clarity and readability.
- Format for notes (bold, italics, bullet points) if it helps.
- Use plain text math with actual symbols (², ×, ÷, √) instead of LaTeX ($...$) when showing formulas.
Do NOT change the meaning or add new content.
Keep the text concise and note-friendly.
If you are unsure how to improve it, return the original text exactly as it was.
Do not make large rewrites; keep changes subtle and minimal.
`;

    const chat = await aiClient.chats.create({
      model: "gemini-2.5-flash-lite",
      config: { systemInstruction },
      history: [
        {
          role: "user",
          parts: [{ text: `Enhance this highlighted text:\n\n${highlight}` }],
        },
      ],
    });

    const response = await chat.sendMessage({ message: highlight });
    return response.text;
  } catch (err) {
    console.error("enhancePrompt error:", err?.message || err);
    throw new Error("AI enhance failed: " + (err?.message || String(err)));
  }
}

export async function notePrompt(highlight, notes, mode) {
  if (!highlight) throw new Error("Highlight is required");
  try {
    const aiClient = await ensureClient();

    const systemInstruction = `
You are an AI assistant specialized in helping users take high-quality notes.
Always write clearly, concisely, and directly relevant to the highlighted text.
Ensure you are following your main instruction and focusing on doing that.
Keep responses short and note-friendly (1–3 sentences if possible).
Use simple language, proper formatting, and avoid unnecessary filler.
only provide content for the highlighted section.
`;

    let instruction = "";
    switch (mode) {
      case "explain":
        instruction = `Explain the highlighted text in simple terms: "${highlight}"`;
        break;
      case "expand":
        instruction = `Add relevant details, examples, or elaboration for the highlighted text: "${highlight}"`;
        break;
      case "summarize":
        instruction = `Summarize the highlighted text concisely for notes: "${highlight}"`;
        break;
      case "question":
        instruction = `Generate a single clear question about the highlighted text for quizzing: "${highlight}"`;
        break;
      case "connect":
        instruction = `Show connections between this highlighted text and other parts of the notes: "${highlight}"`;
        break;
      default:
        instruction = `Provide a concise note-friendly insight for the highlighted text: "${highlight}"`;
    }

    const chat = await aiClient.chats.create({
      model: "gemini-2.5-flash-lite",
      config: { systemInstruction },
      history: [
        {
          role: "user",
          parts: [
            {
              text: `Here are the notes:\n${notes}\n\nInstruction:\n${instruction}`,
            },
          ],
        },
      ],
    });

    const response = await chat.sendMessage({ message: highlight });
    return response.text;
  } catch (err) {
    console.error("notePrompt error:", err?.message || err);
    throw new Error("AI notePrompt failed: " + (err?.message || String(err)));
  }
}

export async function sendMessageToGemini(selectedText, docContent, messages) {
  try {
    const aiClient = await ensureClient();

    const systemInstruction = `You are an AI assistant specialized in helping users with their notes. 
            You can summarize, explain, or provide insights based on the content of their notes. 
            Always answer clearly, concisely, and contextually using the notes provided.`;

    const history = [
      {
        role: "user",
        parts: [{ text: `Here are my notes:\n${docContent}` }],
      },
      ...messages
        .slice(-5)
        .map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
    ];

    const chat = await aiClient.chats.create({
      model: "gemini-2.5-flash",
      config: { systemInstruction },
      history,
    });

    const response = await chat.sendMessage({ message: selectedText });
    return response.text;
  } catch (err) {
    console.error("sendMessageToGemini error:", err?.message || err);
    throw new Error("AI sendMessage failed: " + (err?.message || String(err)));
  }
}
