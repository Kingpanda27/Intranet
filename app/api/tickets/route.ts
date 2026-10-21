import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, role: true }
        }
      }
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    console.error("[API Tickets GET Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { from, email, box, category, severity, issue, summary, history, source } = body;

    if (!from || !issue) {
      return NextResponse.json({ error: 'Missing required fields: from, issue' }, { status: 400 });
    }

    // Attempt to link active user session if available
    let userId: string | null = null;
    try {
      const session = await getServerSession(authOptions);
      const user = session?.user as any;
      if (user?.id) {
        userId = user.id;
      }
    } catch {
      // Session extraction optional
    }

    // Fallback: If not logged in via session, lookup user by email
    if (!userId && email) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() }
      });
      if (userByEmail) {
        userId = userByEmail.id;
      }
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        from: from.trim(),
        email: email ? email.trim() : null,
        box: box ? box.trim() : null,
        category: category || 'General',
        severity: severity || 'Normal',
        issue: issue.trim(),
        summary: summary || issue,
        history: typeof history === 'object' ? JSON.stringify(history) : history || null,
        source: source || 'Chat Web',
        status: 'OPEN',
        userId: userId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    console.log(`[API /api/tickets] New ticket created #${ticket.id.slice(-6)} (${ticket.source}) for ${ticket.from}`);

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("[API Tickets POST Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
