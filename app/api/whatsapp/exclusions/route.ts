import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWhatsAppExclusionsFromDb } from '@/lib/supportAiLlamaService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

async function verifyAuth(reqRole?: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "No autenticado", status: 401 };

  if (reqRole) {
    const role = (session.user as any)?.role;
    const isSuperAdmin = (session.user as any)?.isSuperAdmin || (session.user as any)?.email === (process.env.SUPERADMIN_EMAIL || "ireyes@tnoutsourcing.com");
    if (!isSuperAdmin && role !== "TECHNOLOGY" && role !== "TECHNOLOGY_ADMIN" && role !== "IT_MANAGER") {
      return { error: "Acceso denegado: se requieren permisos administrativos", status: 403 };
    }
  }

  return { session };
}

export async function GET() {
  const auth = await verifyAuth(false);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await getWhatsAppExclusionsFromDb();
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error("[API WhatsApp Exclusions GET Error]:", error);
    return NextResponse.json({ success: false, error: "Error al recuperar exclusiones" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await verifyAuth(true);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { value, type, ignoreAllGroups } = body;

    // Actualizar flag ignoreAllGroups si fue enviado
    if (typeof ignoreAllGroups === 'boolean') {
      await prisma.whatsappSetting.upsert({
        where: { id: 'default' },
        update: { ignoreAllGroups },
        create: { id: 'default', ignoreAllGroups },
      });
    }

    // Agregar número o grupo si fue enviado
    if (value) {
      const cleanValue = value.trim();
      const exclusionType = type === 'GROUP' || cleanValue.endsWith('@g.us') ? 'GROUP' : 'NUMBER';

      await prisma.whatsappExclusion.upsert({
        where: { value: cleanValue },
        update: { type: exclusionType },
        create: { value: cleanValue, type: exclusionType },
      });
    }

    const updated = await getWhatsAppExclusionsFromDb();
    return NextResponse.json({ success: true, ...updated });
  } catch (error: any) {
    console.error("[API WhatsApp Exclusions POST Error]:", error);
    return NextResponse.json({ success: false, error: "Error al guardar exclusión" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await verifyAuth(true);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { value } = body;

    if (!value) {
      return NextResponse.json({ error: 'Missing value to delete' }, { status: 400 });
    }

    await prisma.whatsappExclusion.deleteMany({
      where: { value: value.trim() },
    });

    const updated = await getWhatsAppExclusionsFromDb();
    return NextResponse.json({ success: true, ...updated });
  } catch (error: any) {
    console.error("[API WhatsApp Exclusions DELETE Error]:", error);
    return NextResponse.json({ success: false, error: "Error al eliminar exclusión" }, { status: 500 });
  }
}
