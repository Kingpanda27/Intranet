import { NextResponse } from 'next/server';
import { generateOllamaResponse, generateNvidiaResponse } from '@/lib/supportAiLlamaService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { prompt, model, host, provider, systemPrompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    let responseText = '';
    let usedProvider = 'nvidia';

    if (provider === 'ollama' && host) {
      responseText = await generateOllamaResponse(prompt, model || 'llama3.2:latest', host);
      usedProvider = 'ollama';
    } else if (process.env.NVIDIA_API_KEY) {
      try {
        responseText = await generateNvidiaResponse(prompt, model, systemPrompt);
        usedProvider = 'nvidia';
      } catch (err: any) {
        console.warn('[API Route] NVIDIA failed, attempting Ollama fallback:', err.message);
        responseText = await generateOllamaResponse(prompt, model || 'llama3.2:latest', host);
        usedProvider = 'ollama';
      }
    } else {
      responseText = await generateOllamaResponse(prompt, model || 'llama3.2:latest', host);
      usedProvider = 'ollama';
    }

    return NextResponse.json({ response: responseText, provider: usedProvider });
  } catch (error: any) {
    console.error("[API AI Generate Error]:", error);
    return NextResponse.json({
      error: 'Error al generar respuesta de IA'
    }, { status: 500 });
  }
}
