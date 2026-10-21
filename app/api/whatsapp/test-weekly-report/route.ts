import { NextResponse } from 'next/server';
import { generateAndSendWeeklyEmailReport } from '@/lib/supportAiLlamaService';

export async function POST() {
  try {
    const result = await generateAndSendWeeklyEmailReport();
    return NextResponse.json({ success: true, message: "Reporte semanal por correo generado correctamente.", details: result });
  } catch (error: any) {
    console.error("[API Test Weekly Report Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
