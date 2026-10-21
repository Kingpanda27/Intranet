export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initSupportAiLlamaService } = await import('@/lib/supportAiLlamaService');
    try {
      await initSupportAiLlamaService();
    } catch (e) {
      console.error("[Instrumentation] Error initializing Support AILlama service:", e);
    }
  }
}
