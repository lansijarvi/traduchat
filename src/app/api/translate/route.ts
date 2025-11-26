import { NextRequest, NextResponse } from "next/server";
import { translateMessage } from "@/ai/flows/real-time-translation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, fromLanguage, toLanguage } = body;

    if (!text || !toLanguage) {
      return NextResponse.json(
        { error: "Text and target language required" },
        { status: 400 }
      );
    }

    // Skip if same language
    if (fromLanguage === toLanguage) {
      return NextResponse.json({
        translatedText: text,
        skipped: true,
      });
    }

    // Use your existing Genkit translation flow
    const result = await translateMessage({
      text,
      sourceLanguage: fromLanguage as 'en' | 'es',
      targetLanguage: toLanguage as 'en' | 'es',
    });

    return NextResponse.json({
      translatedText: result.translatedText,
    });
  } catch (error: any) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { error: error.message || "Translation failed" },
      { status: 500 }
    );
  }
}
