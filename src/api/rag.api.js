/**
 * RAG study assistant (separate service from main AMS API).
 * Dev: proxied via vite `/rag-service` → http://127.0.0.1:8000
 * Prod: set VITE_RAG_API_URL (e.g. https://rag.example.com, no trailing slash)
 */
function getRagBaseUrl() {
  const fromEnv = import.meta.env.VITE_RAG_API_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/$/, "");
  }
  return "/rag-service";
}

/**
 * @param {{ question: string, class: string, subject: string, top_k?: number }} body
 * @returns {Promise<{ question: string, answer: string, sources: Array, prompt: string|null }>}
 */
export async function ragAsk(body) {
  const url = "https://school-rag-api-272454562298.asia-south1.run.app/ask";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: body.question,
      class: body.class,
      subject: body.subject,
      top_k: body.top_k ?? 5,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Ask failed (${res.status})`);
  }

  const data = await res.json();
  return {
    question: data.question ?? body.question,
    answer: typeof data.answer === "string" ? data.answer : "",
    sources: Array.isArray(data.sources) ? data.sources : [],
    prompt: data.prompt ?? null,
  };
}
