import { NextResponse } from 'next/server';
import { generateOllamaResponse, generateNvidiaResponse } from '@/lib/supportAiLlamaService';

export async function POST(req: Request) {
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
      error: 'Failed to generate AI response',
      details: error.message
    }, { status: 500 });
  }
}
