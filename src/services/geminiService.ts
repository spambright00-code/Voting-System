
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (!aiClient) {
    // Using process.env.API_KEY as per coding guidelines
    const apiKey = process.env.API_KEY || '';
    
    if (!apiKey) console.warn("API Key for Gemini is missing (process.env.API_KEY).");
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const generateElectionInsight = async (prompt: string, contextData: string): Promise<string> => {
  try {
    const client = getAiClient();
    const model = "gemini-2.5-flash";
    
    const fullPrompt = `
      You are an expert Election Administrator Assistant for the Teacher Welfare Association.
      
      Context Data (Current Election State):
      ${contextData}

      Task:
      ${prompt}

      Keep the response professional, concise, and action-oriented. If drafting an SMS, keep it under 160 characters.
    `;

    const response = await client.models.generateContent({
      model,
      contents: fullPrompt,
    });

    return response.text || "Unable to generate insight at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service. Please check your API key configuration.";
  }
};