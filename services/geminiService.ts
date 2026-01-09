
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: any;

  constructor() {
    if (!process.env.API_KEY) {
      console.error("CRITICAL: API_KEY is missing from environment variables. Detection will fail.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  }

  async detectObjects(base64Image: string): Promise<{ label: string; confidence: number; box_2d: [number, number, number, number] }[]> {
    try {
      if (!process.env.API_KEY) return [];

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              text: "Analyze this image. Identify objects and their bounding boxes. For each object, return a JSON object with 'label' (name), 'confidence' (0-1), and 'box_2d' (normalized [ymin, xmin, ymax, xmax] from 0 to 1000). Return a JSON array of these objects.",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                box_2d: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                },
              },
              required: ["label", "confidence", "box_2d"],
            },
          },
        },
      });

      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Detection Error:", error);
      return [];
    }
  }
}
