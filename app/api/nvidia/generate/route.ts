import { NextResponse } from 'next/server';
import { generateNvidiaResponse } from '@/lib/supportAiLlamaService';

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const responseText = await generateNvidiaResponse(prompt, model);
    return NextResponse.json({ success: true, response: responseText });
  } catch (error: any) {
    console.error("[API NVIDIA Generate Error]:", error);
    return NextResponse.json({
      error: 'Failed to generate response with NVIDIA AI',
      details: error.message
    }, { status: 500 });
  }
}
