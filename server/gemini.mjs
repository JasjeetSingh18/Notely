import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


export async function promptAI(prompt) {
  const responseChunks = [];

  const streamResp = await ai.models.generateContentStream({
    model: "gemini-2.5-flash-lite", //Change model here
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  for await (const chunk of streamResp) {
    if (chunk.text) {
      responseChunks.push(chunk.text);
    }
  }

  return responseChunks.join("");
}


export async function enhancePrompt(highlight) {
  if (!highlight) throw new Error("Highlight is required");

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

  const chat = await ai.chats.create({
    model: "gemini-2.5-flash-lite",
    config: { systemInstruction },
    history: [
      {
        role: "user",
        parts: [
          {
            text: `Enhance this highlighted text:\n\n${highlight}`
          }
        ]
      }
    ],
  });

  const response = await chat.sendMessage({ message: highlight });


  return response.text;
}


export async function notePrompt(highlight, notes, mode) {
  if (!highlight) throw new Error("Highlight is required");

  // Define what the AI should do, as the system instruction
  const systemInstruction = `
You are an AI assistant specialized in helping users take high-quality notes.
Always write clearly, concisely, and directly relevant to the highlighted text.
Ensure you are following your main instruction and focusing on doing that.
Keep responses short and note-friendly (1–3 sentences if possible).
Use simple language, proper formatting, and avoid unnecessary filler.
only provide content for the highlighted section.
`;

  // Mode-specific prompt instructions
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

  const chat = ai.chats.create({
    model: "gemini-2.5-flash-lite",
    config: { systemInstruction },
    history: [
      {
        role: "user",
        parts: [
          {
            text: `Here are the notes:\n${notes}\n\nInstruction:\n${instruction}`
          }
        ]
      }
    ],
  });

  const response = await chat.sendMessage({
    message: highlight
  });

  return response.text;
}

export async function sendMessageToGemini(selectedText, docContent, messages) {
  // Build history: first include the doc context as a "user" message
    const systemInstruction = `You are an AI assistant specialized in helping users with their notes. 
            You can summarize, explain, or provide insights based on the content of their notes. 
            Always answer clearly, concisely, and contextually using the notes provided.`;

  const history = [
    {
      role: "user",
      parts: [{ text: `Here are my notes:\n${docContent}` }],
    },
    ...messages.slice(-5).map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  ];

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: { systemInstruction },

    history,
  });

  const response = await chat.sendMessage({
    message: selectedText, // the user’s current question or selection
  });

  return response.text;
}
