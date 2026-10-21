import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/supportAiLlamaService';

export async function POST(req: Request) {
  try {
    const { phone, message } = await req.json();
    if (!phone || !message) {
      return NextResponse.json({ error: 'Missing phone or message' }, { status: 400 });
    }

    const result = await sendWhatsAppMessage(phone, message);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API WhatsApp Send Error]:", error);
    return NextResponse.json({ error: 'Failed to send WhatsApp message', details: error.message }, { status: 500 });
  }
}
