import { NextResponse } from 'next/server';
import { generateAndSendMonthlyReport } from '@/lib/supportAiLlamaService';

export async function POST() {
  try {
    const result = await generateAndSendMonthlyReport();
    return NextResponse.json({ success: true, message: "Reporte mensual generado correctamente.", details: result });
  } catch (error: any) {
    console.error("[API Test Monthly Report Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
