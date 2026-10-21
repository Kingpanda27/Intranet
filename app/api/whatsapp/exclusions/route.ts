import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWhatsAppExclusionsFromDb } from '@/lib/supportAiLlamaService';

export async function GET() {
  try {
    const data = await getWhatsAppExclusionsFromDb();
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error("[API WhatsApp Exclusions GET Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
