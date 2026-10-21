async function testLanguages() {
  console.log("=== PRUEBA DE GENERACIÓN BILINGÜE CON NVIDIA AI ===\n");

  // 1. Prueba en Español
  const promptEs = `Eres AILlama, un asistente profesional de soporte IT de Telecom Networks. Categoría: Audio / Auriculares. Problema reportado por el usuario: "No tengo audio en mi equipo".
REGLAS OBLIGATORIAS:
1. Responde ÚNICAMENTE en idioma ESPAÑOL. Está terminantemente prohibido responder en inglés.
2. Proporciona exactamente UN solo paso de solución básico, simple y comprensible para un usuario sin conocimientos técnicos.
3. No sugieras pasos avanzados (como Safe Mode, BIOS, consola de comandos CMD/PowerShell ni modificaciones del registro).
4. No ofrezcas múltiples soluciones todavía. Sé directo, amable y conciso.`;

  console.log("[1/2] Enviando prompt en ESPAÑOL...");
  const resEs = await fetch('http://localhost:3000/api/ollama/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: promptEs }),
  });
  const dataEs = await resEs.json();
  console.log("\n--- Respuesta en Español (NVIDIA) ---");
  console.log(dataEs.response);

  // 2. Prueba en English
  const promptEn = `You are AILlama, a professional IT Support Assistant for Telecom Networks. Category: Audio / Headset. User issue: "I have no sound on my headset".
MANDATORY RULES:
1. Respond STRICTLY in ENGLISH. It is strictly forbidden to respond in Spanish.
2. Provide exactly ONE simple, basic user-level troubleshooting step they can easily try.
3. Avoid advanced technical steps like Safe Mode, BIOS, command line (CMD/PowerShell), or registry edits.
4. Do not offer multiple solutions yet. Keep it brief, friendly, and concise for non-technical users.`;

  console.log("\n[2/2] Enviando prompt en INGLÉS...");
  const resEn = await fetch('http://localhost:3000/api/ollama/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: promptEn }),
  });
  const dataEn = await resEn.json();
  console.log("\n--- Respuesta en Inglés (NVIDIA) ---");
  console.log(dataEn.response);
}

testLanguages();
