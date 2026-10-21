import { NodeSSH } from 'node-ssh';

async function verify() {
  const host = process.env.REMOTE_HOST || '192.168.80.241';
  const username = process.env.REMOTE_USER || 'root';
  const password = process.env.REMOTE_PASSWORD || '';
  await ssh.connect({ host, username, password });

  const pm2Res = await ssh.execCommand('pm2 status intranet');
  console.log("PM2 Status:\n", pm2Res.stdout);

  const testCurl = await ssh.execCommand('curl -s -I http://127.0.0.1:3000/ | head -n 5');
  console.log("Port 3000 Header:\n", testCurl.stdout);

  const testAi = await ssh.execCommand(`
    curl -s -X POST http://127.0.0.1:3000/api/ollama/generate \
      -H "Content-Type: application/json" \
      -d '{"prompt": "Di exactamente: Servidor 192.168.80.241 listo y operativo en español."}'
  `);
  console.log("AI Endpoint Response:\n", testAi.stdout);

  ssh.dispose();
}

verify().catch(console.error);
