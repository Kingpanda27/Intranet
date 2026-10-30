import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { semanticSearch } from '@/app/actions/embeddingActions';
import { isCEO } from '@/lib/authorizationRoles';
import { NON_ABSENCE_REQUEST_TYPES } from '@/lib/userUtils';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const currentUserName = (session.user as any).name || "Empleado";
    const isMasterAdmin = isCEO(session.user as any);

    const body = await req.json();
    const messages = body.messages || [];
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || "";
    const userQuery = lastUserMessage.toLowerCase();

    // 1. Contexto del usuario actual
    const userObj = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { name: true, role: true, vacationBalance: true, position: true, project: { select: { name: true } } }
    });

    // 2. Extraer términos de búsqueda de la pregunta (sin palabras vacías)
    const searchTerms = lastUserMessage
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w: string) => w.length >= 3 && ![
        "cuantas", "cuántas", "cuanto", "cuánto", "quedan", "quedna", "tiene", "dias", "días",
        "para", "del", "las", "los", "una", "uno", "que", "por", "favor", "hola", "buenas",
        "vacacion", "vacaciones", "permiso", "permisos", "como", "cómo", "esta", "está",
        "donde", "dónde", "quien", "quién", "saber", "dime", "puedes", "informacion", "información",
        "sobre", "todo", "toda", "todos", "todas"
      ].includes(w.toLowerCase()));

    // 3. BÚSQUEDA MULTI-TABLA EN TODA LA APLICACIÓN

    // A) Colaboradores y Empleados (compatible con MySQL, sin 'mode: insensitive')
    let queriedUsersContext = "";
    if (searchTerms.length > 0) {
      try {
        const matchedUsers = await prisma.user.findMany({
          where: {
            OR: searchTerms.flatMap((w: string) => [
              { name: { contains: w } },
              { email: { contains: w } },
              { position: { contains: w } }
            ])
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            position: true,
            vacationBalance: true,
            project: { select: { name: true } },
            requests: {
              take: 3,
              orderBy: { createdAt: 'desc' },
              select: {
                type: true,
                status: true,
                startDate: true,
                endDate: true,
                requestedDays: true,
                reason: true
              }
            }
          },
          take: 8
        });

        if (matchedUsers.length > 0) {
          queriedUsersContext = "\n\nColaboradores Encontrados en la Base de Datos:\n" + 
            matchedUsers.map(u => {
              const reqsStr = u.requests && u.requests.length > 0 
                ? u.requests.map(r => `[${r.type} - Estado: ${r.status}, Del ${new Date(r.startDate).toLocaleDateString("es-ES")} al ${new Date(r.endDate).toLocaleDateString("es-ES")}, Motivo: ${r.reason}]`).join("; ")
                : "Sin solicitudes registradas";
              return `- ${u.name} | Cargo: ${u.position || u.role} | Rol: ${u.role} | Departamento/Grupo: ${u.project?.name || 'Sin Asignación'} | Balance de Vacaciones: ${u.vacationBalance ?? 0} días disponibles | Email: ${u.email} | Historial de Solicitudes: ${reqsStr}`;
            }).join("\n");
        }
      } catch (err) {
        console.warn("[TN Assistant] Error querying matched users:", err);
      }
    }

    // B) Grupos y Campañas Corporativas
    let groupsContext = "";
    try {
      const isGroupQuery = userQuery.includes("grupo") || userQuery.includes("campaña") || userQuery.includes("campana") || userQuery.includes("departamento") || userQuery.includes("equipo");
      const groups = await prisma.project.findMany({
        select: {
          name: true,
          description: true,
          supervisors: { select: { name: true } },
          subLeaders: { select: { name: true } },
          _count: { select: { members: true } }
        },
        take: isGroupQuery ? 15 : 6
      });
      if (groups.length > 0) {
        groupsContext = "\n\nGrupos y Campañas Corporativas:\n" + groups.map(g => {
          const leaders = [...g.supervisors.map(s => `Supervisor: ${s.name}`), ...g.subLeaders.map(sl => `Sub-Líder: ${sl.name}`)].join(", ") || "Sin líder asignado";
          return `- Grupo: ${g.name} (${g._count.members} integrantes) | Liderazgo: ${leaders} | ${g.description || ''}`;
        }).join("\n");
      }
    } catch (e) {}

    // C) Directorio General
    let directoryContext = "";
    if (userQuery.includes("quien") || userQuery.includes("quién") || userQuery.includes("empleado") || userQuery.includes("directorio") || userQuery.includes("personal") || userQuery.includes("contacto")) {
      try {
        const users = await prisma.user.findMany({
          select: { name: true, role: true, position: true, email: true, vacationBalance: true, project: { select: { name: true } } },
          take: 20
        });
        directoryContext = "\n\nDirectorio General de Empleados:\n" + users.map(u => `- ${u.name} (${u.position || u.role}) - Depto: ${u.project?.name || 'General'}, Vacaciones: ${u.vacationBalance ?? 0} días, Email: ${u.email}`).join("\n");
      } catch (e) {}
    }

    // D) Eventos y Calendario
    let eventsContext = "";
    if (userQuery.includes("evento") || userQuery.includes("calendario") || userQuery.includes("semana") || userQuery.includes("reunión") || userQuery.includes("reunion") || userQuery.includes("actividad")) {
      try {
        const events = await prisma.calendarEvent.findMany({
          where: { startDate: { gte: new Date() } },
          orderBy: { startDate: 'asc' },
          take: 5
        });
        eventsContext = "\n\nPróximos Eventos:\n" + (events.length > 0 ? events.map(e => `- ${e.title} (${new Date(e.startDate).toLocaleDateString("es-ES")})`).join("\n") : "No hay eventos próximos agendados.");
      } catch (e) {}
    }

    // E) Publicaciones del Muro de Noticias
    let postsContext = "";
    if (userQuery.includes("noticia") || userQuery.includes("publicacion") || userQuery.includes("publicación") || userQuery.includes("post") || userQuery.includes("muro") || userQuery.includes("comunicado")) {
      try {
        const posts = await prisma.post.findMany({
          orderBy: { createdAt: 'desc' },
          take: 4,
          select: { content: true, createdAt: true, author: { select: { name: true } } }
        });
        if (posts.length > 0) {
          postsContext = "\n\nPublicaciones Recientes del Muro:\n" + posts.map(p => `- [${p.author?.name || 'Anónimo'}]: ${p.content} (${new Date(p.createdAt).toLocaleDateString("es-ES")})`).join("\n");
        }
      } catch (e) {}
    }

    // F) Documentos y Políticas Internas (RAG)
    let docsContext = "";
    if (userQuery.includes("documento") || userQuery.includes("manual") || userQuery.includes("politica") || userQuery.includes("política") || userQuery.includes("reglamento") || userQuery.includes("proceso") || userQuery.includes("onboarding")) {
      try {
        const docResults = await semanticSearch(lastUserMessage, 3);
        if (docResults && docResults.length > 0) {
          docsContext = "\n\nInformación de Documentos Internos:\n" + docResults.map((r: any) => `[${r.document.title}]: ${r.content}`).join("\n\n");
        }
      } catch (e) {}
    }

    // G) Ausencias del Día de Hoy
    let absentsContext = "";
    if (userQuery.includes("ausente") || userQuery.includes("vacaciones") || userQuery.includes("permiso") || userQuery.includes("falto") || userQuery.includes("faltó") || userQuery.includes("quien no vino")) {
      try {
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        const absents = await prisma.timeOffRequest.findMany({
          where: { 
            status: "APPROVED", 
            startDate: { lte: endOfDay }, 
            endDate: { gte: startOfDay },
            type: { notIn: NON_ABSENCE_REQUEST_TYPES }
          },
          include: { user: { select: { name: true } } }
        });
        absentsContext = "\n\nEmpleados Ausentes Hoy:\n" + (absents.length > 0 ? absents.map(a => `- ${a.user.name} (${a.type})`).join("\n") : "No hay empleados ausentes hoy.");
      } catch (e) {}
    }

    const generalPolicyContext = `\n\nPolíticas de Vacaciones de Telecom Networks:
- Vacaciones anuales: Todo colaborador tiene derecho a vacaciones pagadas acumuladas según su tiempo y balance registrado en el sistema (usualmente 14 días laborables por año).
- Solicitudes: Se gestionan desde el módulo 'Vacaciones y Permisos'.`;

    const systemPrompt = `Eres TN Assistant, el asistente corporativo inteligente de la intranet de Telecom Networks (TN).

<user_profile>
Usuario consultando: ${currentUserName}
Nivel de Autorización: ${isMasterAdmin ? "ADMINISTRADOR MAESTRO / CEO / ACCESO TOTAL ILIMITADO" : userObj?.role || 'Empleado'}
Departamento: ${userObj?.project?.name || 'General'}
Vacaciones Disponibles de ${currentUserName}: ${userObj?.vacationBalance ?? 0} días
</user_profile>

<retrieved_context>
${queriedUsersContext}
${groupsContext}
${directoryContext}
${eventsContext}
${postsContext}
${docsContext}
${absentsContext}
${generalPolicyContext}
</retrieved_context>

Instrucciones Obligatorias:
- Responde siempre en español con tono profesional, ejecutivo, claro y conciso.
- ${isMasterAdmin ? `Estás hablando con Iván Reyes, Administrador Maestro y CEO de la empresa. Él tiene autorización absoluta para consultar y conocer cualquier dato de cualquier empleado, grupo, solicitud o registro. NUNCA le digas que contacte a Recursos Humanos ni a un supervisor; dale la respuesta directa, completa y con las cifras exactas registradas en <retrieved_context>.` : `Responde cordialmente con los datos corporativos autorizados.`}
- Si el usuario pregunta por el balance de vacaciones de una persona (ej. Johan Taveras u otro colaborador), revisa la sección <retrieved_context> y responde con su nombre completo, cargo, departamento y sus días de vacaciones disponibles.
- Si una persona o dato no se encuentra en la base de datos tras la búsqueda, aclara el nombre exacto que buscaste y sugiere verificar el nombre en el directorio.
- Sé directo y evita rodeos.`;

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
                      } catch (e) {}
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
