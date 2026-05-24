const STUDENT_RAG_URL = "https://school-rag-api-272454562298.asia-south1.run.app/ask";
const TEACHER_RAG_URL = "https://school-rag-api-rekohz7zqa-el.a.run.app/ask";

async function _ragFetch(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Ask failed (${res.status})`);
  }
  const data = await res.json();
  return {
    question: data.question ?? payload.question,
    answer: typeof data.answer === "string" ? data.answer : "",
    sources: Array.isArray(data.sources) ? data.sources : [],
    mode: data.mode ?? null,
    prompt: data.prompt ?? null,
  };
}

/**
 * @param {{ question: string, class: string, subject: string, top_k?: number }} body
 */
export function ragAsk(body) {
  return _ragFetch(STUDENT_RAG_URL, {
    question: body.question,
    class: body.class,
    subject: body.subject,
    top_k: body.top_k ?? 5,
  });
}

/**
 * @param {{ question: string, class: string, subject: string, session_id: string, top_k?: number }} body
 */
export function ragAskTeacher(body) {
  return _ragFetch(TEACHER_RAG_URL, {
    question: body.question,
    class: body.class,
    subject: body.subject,
    session_id: body.session_id,
    top_k: body.top_k ?? 5,
    mode: "teacher",
  });
}
