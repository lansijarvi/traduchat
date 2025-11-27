import { NextRequest, NextResponse } from 'next/server';
import { translateMessage } from '@/ai/flows/real-time-translation';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Spanish to English translation...');
    
    const result = await translateMessage({
      text: 'Hola, ¿cómo estás?',
      sourceLanguage: 'es',
      targetLanguage: 'en',
    });
    
    console.log('Translation result:', result);
    
    return NextResponse.json({
      success: true,
      original: 'Hola, ¿cómo estás?',
      translated: result.translatedText,
      sourceLanguage: 'es',
      targetLanguage: 'en'
    });
  } catch (error: any) {
    console.error('Translation test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
