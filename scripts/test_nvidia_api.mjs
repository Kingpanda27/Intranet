async function testNvidia() {
  const apiKey = process.env.NVIDIA_API_KEY || '';
  if (!apiKey) {
    console.error("NVIDIA_API_KEY not set in environment.");
    return;
  }
  const prompt = 'You are AILlama, a professional IT Support Assistant for Telecom Networks. Category: Red / Conectividad. User issue: "No me carga ninguna página web". Provide exactly ONE simple, basic user-level troubleshooting step they can easily try. Respond in Spanish.';

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-11b-vision-instruct',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Result content:", data.choices?.[0]?.message?.content);
  } catch (err) {
    console.error("Error:", err);
  }
}

testNvidia();
