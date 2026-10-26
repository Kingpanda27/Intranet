import { NextResponse } from 'next/server';
import { generateGeminiResponse } from '@/lib/supportAiLlamaService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return NextResponse.json({
        response: "**Nota:** La clave de Google Gemini no está configurada en las variables de entorno."
      });
    }

    const responseText = await generateGeminiResponse(prompt);
    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error("[API Gemini Generate Error]:", error);
    return NextResponse.json({
      error: 'Error al generar respuesta con Gemini AI'
    }, { status: 500 });
  }
}
