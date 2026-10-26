import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { semanticSearch } from '@/app/actions/embeddingActions';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const currentUserName = (session.user as any).name || "Empleado";

    const body = await req.json();
    const messages = body.messages || [];
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || "";
    const userQuery = lastUserMessage.toLowerCase();

    // 1. Contexto del usuario actual
    const userObj = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { name: true, role: true, vacationBalance: true, position: true, project: { select: { name: true } } }
    });

    // 2. Búsqueda inteligente de colaboradores consultados (por nombre o apellido en la pregunta)
    let queriedUsersContext = "";
    const cleanWords = lastUserMessage
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w: string) => w.length >= 3 && ![
        "cuantas", "cuántas", "cuanto", "cuánto", "quedan", "quedna", "tiene", "dias", "días",
        "para", "del", "las", "los", "una", "uno", "que", "por", "favor", "hola", "buenas",
        "vacacion", "vacaciones", "permiso", "permisos", "como", "cómo", "esta", "está",
        "donde", "dónde", "quien", "quién"
      ].includes(w.toLowerCase()));

    if (cleanWords.length > 0) {
      try {
        const matchedUsers = await prisma.user.findMany({
          where: {
            OR: cleanWords.map((word: string) => ({
              name: { contains: word, mode: 'insensitive' }
            }))
          },
          select: {
            name: true,
            email: true,
            role: true,
            position: true,
            vacationBalance: true,
            project: { select: { name: true } }
          },
          take: 5
        });

        if (matchedUsers.length > 0) {
          queriedUsersContext = "\n\nInformación de Colaboradores Consultados:\n" + 
            matchedUsers.map(u => `- ${u.name} | Depto/Grupo: ${u.project?.name || 'Sin asignación'} | Cargo: ${u.position || u.role} | Balance de Vacaciones Disponibles: ${u.vacationBalance ?? 0} días | Email: ${u.email}`).join("\n");
        }
      } catch (err) {
        console.warn("[TN Assistant] Error querying matched users:", err);
      }
    }

    // 3. Directorio de empleados si se consulta por equipo o personal
    let directoryContext = "";
    if (userQuery.includes("quien") || userQuery.includes("quién") || userQuery.includes("empleado") || userQuery.includes("equipo") || userQuery.includes("líder") || userQuery.includes("lider") || userQuery.includes("supervisor") || userQuery.includes("directorio") || userQuery.includes("contacto")) {
      const users = await prisma.user.findMany({
        select: { name: true, role: true, position: true, email: true, vacationBalance: true, project: { select: { name: true } } },
        take: 15
      });
      directoryContext = "\n\nDirectorio de Empleados:\n" + users.map(u => `- ${u.name} (${u.position || u.role}) - Depto: ${u.project?.name || 'Sin asignación'}, Vacaciones: ${u.vacationBalance ?? 0} días, Email: ${u.email}`).join("\n");
    }

    // 4. Próximos eventos de la empresa
    let eventsContext = "";
    if (userQuery.includes("evento") || userQuery.includes("calendario") || userQuery.includes("semana") || userQuery.includes("reunión") || userQuery.includes("reunion") || userQuery.includes("actividad")) {
      const events = await prisma.calendarEvent.findMany({
        where: { startDate: { gte: new Date() } },
        orderBy: { startDate: 'asc' },
        take: 5
      });
      eventsContext = "\n\nPróximos Eventos:\n" + (events.length > 0 ? events.map(e => `- ${e.title} (${new Date(e.startDate).toLocaleDateString("es-ES")})`).join("\n") : "No hay eventos próximos agendados.");
    }

    // 5. Documentos internos (RAG semántico)
    let docsContext = "";
    if (userQuery.includes("documento") || userQuery.includes("manual") || userQuery.includes("politica") || userQuery.includes("política") || userQuery.includes("reglamento") || userQuery.includes("proceso") || userQuery.includes("onboarding")) {
      try {
        const docResults = await semanticSearch(lastUserMessage, 3);
        if (docResults && docResults.length > 0) {
          docsContext = "\n\nInformación de Documentos Internos:\n" + docResults.map((r: any) => `[${r.document.title}]: ${r.content}`).join("\n\n");
        }
      } catch (e) {}
    }

    // 6. Ausencias del día de hoy
    let absentsContext = "";
    if (userQuery.includes("ausente") || userQuery.includes("vacaciones") || userQuery.includes("permiso") || userQuery.includes("falto") || userQuery.includes("faltó") || userQuery.includes("quien no vino")) {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      const absents = await prisma.timeOffRequest.findMany({
        where: { status: "APPROVED", startDate: { lte: endOfDay }, endDate: { gte: startOfDay } },
        include: { user: { select: { name: true } } }
      });
      absentsContext = "\n\nEmpleados Ausentes Hoy:\n" + (absents.length > 0 ? absents.map(a => `- ${a.user.name} (${a.type})`).join("\n") : "No hay empleados ausentes hoy.");
    }

    const generalPolicyContext = `\n\nPolíticas de Vacaciones y Permisos de Telecom Networks:
- Vacaciones anuales: Los colaboradores acumulan y disfrutan de días de vacaciones según su tiempo en la empresa y el balance registrado en el sistema.
- Solicitudes: Se realizan a través del módulo de 'Vacaciones y Permisos' de la intranet.
- Permisos: Incluyen reposición de horas, permisos especiales (horas/días), salidas tempranas e incidencias de soporte remoto.`;

    const systemPrompt = `Eres TN Assistant, el asistente corporativo inteligente de la intranet de Telecom Networks (TN).

<user_profile>
Empleado actual consultando: ${currentUserName} (${userObj?.position || userObj?.role || 'Empleado'}, Depto: ${userObj?.project?.name || 'General'})
Vacaciones Disponibles de ${currentUserName}: ${userObj?.vacationBalance ?? 0} días
</user_profile>

<retrieved_context>
${queriedUsersContext}
${directoryContext}
${eventsContext}
${docsContext}
${absentsContext}
${generalPolicyContext}
</retrieved_context>

Instrucciones:
- Responde siempre en español con tono amable, claro, empático y profesional.
- Si el usuario pregunta por el balance de vacaciones de una persona específica (ej. Johan u otro colaborador), revisa la sección <retrieved_context> y responde con su balance exacto de días disponibles.
- Si la persona no aparece en la información disponible, indícalo cortésmente y sugiere contactar a Recursos Humanos o a su supervisor.
- Sé conciso, directo y útil en tus respuestas.`;

    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'system' ? 'system' : m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content.replace(/<system_instructions>/gi, "") : JSON.stringify(m.content)
    }));

    // =========================================================================
    // 1. MOTOR PRINCIPAL: NVIDIA NIM API (Llama 3.2 11B Vision / Instruct)
    // =========================================================================
    const nvidiaApiKey = process.env.NVIDIA_API_KEY;
    const nvidiaModel = process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';

    if (nvidiaApiKey && nvidiaApiKey.trim()) {
      try {
        console.log(`[TN Assistant] Calling NVIDIA NIM AI (${nvidiaModel})...`);
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${nvidiaApiKey.trim()}`
          },
          body: JSON.stringify({
            model: nvidiaModel,
            messages: [
              { role: 'system', content: systemPrompt },
              ...formattedMessages
            ],
            temperature: 0.2,
            max_tokens: 1024,
            stream: true
          })
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          const encoder = new TextEncoder();

          const stream = new ReadableStream({
            async start(controller) {
              let buffer = "";
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop() || "";

                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith(':')) continue;
                    if (trimmed === 'data: [DONE]') continue;
                    if (trimmed.startsWith('data: ')) {
                      try {
                        const json = JSON.parse(trimmed.slice(6));
                        const textChunk = json.choices?.[0]?.delta?.content;
                        if (textChunk) {
                          controller.enqueue(encoder.encode(textChunk));
                        }
                      } catch (e) {
                        // Ignorar líneas parciales o no-JSON
                      }
                    }
                  }
                }
              } catch (err) {
                console.error("[TN Assistant] NVIDIA Stream reading error:", err);
                controller.enqueue(encoder.encode("\n[Error en streaming de respuesta]"));
              } finally {
                controller.close();
              }
            }
          });

          return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        } else {
          const errText = await response.text();
          console.warn(`[TN Assistant] NVIDIA NIM failed (${response.status}):`, errText);
          // Fall through to Ollama if configured
        }
      } catch (nvidiaErr) {
        console.warn("[TN Assistant] NVIDIA NIM connection error, attempting fallback to Ollama:", nvidiaErr);
      }
    }

    // =========================================================================
    // 2. MOTOR SECUNDARIO / FALLBACK: Ollama local (si NVIDIA no está configurada o falla)
    // =========================================================================
    const configs = await (prisma as any).ollamaConfig.findMany();
    const globalConfig = configs.find((c: any) => c.isGlobal) || configs[0];

    if (!globalConfig) {
      return new Response(
        "No se pudo conectar a los servicios de IA (NVIDIA NIM u Ollama). Por favor verifica que la clave de API o el servidor estén activos.",
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    const response = await fetch(`${globalConfig.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: globalConfig.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedMessages
        ],
        stream: true
      })
    });

    if (!response.ok || !response.body) {
      return new Response(
        `No se pudo obtener respuesta del servidor Ollama (${globalConfig.name}). Verifica que el servidor esté activo.`,
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                const textChunk = parsed.message?.content;
                if (textChunk) {
                  controller.enqueue(encoder.encode(textChunk));
                }
              } catch (e) {}
            }
          }
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer);
              const textChunk = parsed.message?.content;
              if (textChunk) {
                controller.enqueue(encoder.encode(textChunk));
              }
            } catch (e) {}
          }
        } catch (err) {
          controller.enqueue(encoder.encode("\n[Error en streaming de respuesta Ollama]"));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (error: any) {
    console.error("Error in TN Assistant API:", error);
    return new Response("Ocurrió un error al procesar tu consulta con el asistente de IA.", {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}
