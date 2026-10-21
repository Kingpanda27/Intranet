import { NextResponse } from 'next/server';
import { getWhatsAppStatus, initSupportAiLlamaService } from '@/lib/supportAiLlamaService';

export async function GET() {
  try {
    await initSupportAiLlamaService();
    const status = getWhatsAppStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    console.error("[API WhatsApp Status Error]:", error);
    return NextResponse.json({
      ready: false,
      qr: null,
      disabled: process.env.ENABLE_WHATSAPP !== 'true',
      error: error.message
    });
  }
}
