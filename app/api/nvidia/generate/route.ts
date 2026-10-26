import { NextResponse } from 'next/server';
import { generateNvidiaResponse } from '@/lib/supportAiLlamaService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

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
      error: 'Error al generar respuesta con NVIDIA AI'
    }, { status: 500 });
  }
}
