async function testChatSimulation() {
  const prompt = `You are AILlama, a professional IT Support Assistant for Telecom Networks. Category: VPN Issues. User issue: "No me conecta el Cisco AnyConnect, se queda en connecting". Provide exactly ONE simple, basic user-level troubleshooting step they can easily try. IMPORTANT: Avoid advanced technical steps like Safe Mode, BIOS, command line, or network configurations. Keep it brief and easy to understand for non-technical users in Spanish. Do not offer multiple solutions yet.`;

  try {
    const res = await fetch('http://localhost:3000/api/ollama/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Provider:", data.provider);
    console.log("\n--- AI Response ---");
    console.log(data.response);
  } catch (err) {
    console.error("Error:", err);
  }
}

testChatSimulation();
