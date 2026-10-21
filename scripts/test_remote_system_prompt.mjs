import { NodeSSH } from 'node-ssh';

async function testRemoteAll() {
  const host = process.env.REMOTE_HOST || '192.168.80.241';
  const username = process.env.REMOTE_USER || 'root';
  const password = process.env.REMOTE_PASSWORD || '';
  await ssh.connect({ host, username, password });

  // Test Monitor
  console.log("Probando Monitor Intento 1 en servidor...");
  const p1 = JSON.stringify({
    prompt: 'Categoría: Monitores y Pantallas. Problema: "Mi segunda pantalla no da video". Este es el INTENTO 1. Entrega exactamente una sola comprobación física o visual simple según la guía de resolución.',
    systemPrompt: `Eres AILlama, asistente L1. REGLAS: Jamás indiques reiniciar la computadora ni comandos. Entrega UNA sola instrucción por mensaje en segunda persona. Guía Monitores: Paso 1: botón de encendido en la parte inferior/trasera y luz testigo (azul, blanca o ámbar).`
  });
  const res1 = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3000/api/ollama/generate -H "Content-Type: application/json" -d '${p1.replace(/'/g, "'\\''")}'`);
  console.log("Monitor:", JSON.parse(res1.stdout).response);

  // Test Internet
  console.log("\nProbando Internet Intento 1 en servidor...");
  const p2 = JSON.stringify({
    prompt: 'Categoría: Conexión a Internet / Red. Problema: "No puedo entrar a ninguna web". Este es el INTENTO 1. Entrega exactamente una sola comprobación física o visual simple según la guía de resolución.',
    systemPrompt: `Eres AILlama, asistente L1. REGLAS: Jamás indiques reiniciar la computadora ni comandos. Entrega UNA sola instrucción por mensaje en segunda persona. Guía Internet: Paso 1: mirar abajo a la derecha junto a la hora y describir qué icono aparece (pantalla con cable, Wi-Fi, globo terráqueo o X roja).`
  });
  const res2 = await ssh.execCommand(`curl -s -X POST http://127.0.0.1:3000/api/ollama/generate -H "Content-Type: application/json" -d '${p2.replace(/'/g, "'\\''")}'`);
  console.log("Internet:", JSON.parse(res2.stdout).response);

  ssh.dispose();
}

testRemoteAll().catch(console.error);
