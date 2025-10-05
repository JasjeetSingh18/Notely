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

export async function sendMessageToGemini(selectedText, docContent, messages) {
  // Build history: first include the doc context as a "user" message
    const systemMessage = {
    role: "model",
    parts: [{
        text: `You are an AI assistant specialized in helping users with their notes. 
            You can summarize, explain, or provide insights based on the content of their notes. 
            Always answer clearly, concisely, and contextually using the notes provided.`
    }]
    };

  const history = [
    systemMessage,
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
    history,
  });

  const response = await chat.sendMessage({
    message: selectedText, // the user’s current question or selection
  });

  return response.text;
}
