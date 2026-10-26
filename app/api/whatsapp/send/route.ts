import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/supportAiLlamaService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const role = (session.user as any)?.role;
  const isSuperAdmin = (session.user as any)?.isSuperAdmin || (session.user as any)?.email === (process.env.SUPERADMIN_EMAIL || "ireyes@tnoutsourcing.com");
  if (!isSuperAdmin && role !== "TECHNOLOGY" && role !== "TECHNOLOGY_ADMIN" && role !== "IT_MANAGER") {
    return NextResponse.json({ error: "Acceso denegado: se requieren permisos administrativos" }, { status: 403 });
  }

  try {
    const { phone, message } = await req.json();
    if (!phone || !message) {
      return NextResponse.json({ error: 'Missing phone or message' }, { status: 400 });
    }

    const result = await sendWhatsAppMessage(phone, message);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API WhatsApp Send Error]:", error);
    return NextResponse.json({ error: 'Error al enviar mensaje por WhatsApp' }, { status: 500 });
  }
}
