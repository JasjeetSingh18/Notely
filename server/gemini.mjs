import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


export async function promptAI(prompt) {
  const responseChunks = [];

  const streamResp = await ai.models.generateContentStream({
    model: "gemini-2.5-pro", //Change model here
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  for await (const chunk of streamResp) {
    if (chunk.text) {
      responseChunks.push(chunk.text);
    }
  }

  return responseChunks.join("");
}


export async function promptAIStream(prompt) {
  const streamResp = await ai.models.generateContentStream({
    model: "gemini-2.5-pro",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  for await (const chunk of streamResp) {
    if (chunk.text) {
      process.stdout.write(chunk.text);
      if (process.stdout.flush) process.stdout.flush();
    }
  }

  console.log();
}