import { NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/lib/supportAiLlamaService';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return NextResponse.json({
        response: "**Nota:** La clave de Google Gemini no está configurada. Agrega tu GEMINI_API_KEY en el archivo .env de la Intranet para habilitar la generación real."
      });
    }

    const responseText = await generateGeminiResponse(prompt);
    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error("[API Gemini Generate Error]:", error);
    return NextResponse.json({
      error: 'Failed to fetch from Gemini API',
      details: error.message
    }, { status: 500 });
  }
}
