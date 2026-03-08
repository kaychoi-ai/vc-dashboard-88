import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { modelName, prompt } = await req.json();
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Improved JSON extraction: find the first { and last }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response did not contain valid JSON structure.");
    }
    
    const jsonString = jsonMatch[0];
    const data = JSON.parse(jsonString);
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Insight Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI insights from the server." },
      { status: 500 }
    );
  }
}
