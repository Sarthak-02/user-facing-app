import { useEffect, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "neutral" });

/**
 * AI-generated Mermaid often contains characters that are illegal in unquoted
 * node labels: single quotes (') and parentheses inside [...] or {...}.
 * This function fixes both before handing the code to Mermaid's parser.
 */
function sanitize(code) {
  return (
    code
      // Single quotes break Mermaid's lexer — replace with Unicode lookalike
      .replace(/'/g, "ʼ")
      // Quote [...] labels that contain parentheses or other risky chars
      .replace(/\[(?!")([^\]"]*[()=*/^][^\]"]*)\]/g, (_, inner) => `["${inner}"]`)
      // Quote {...} labels that contain parentheses
      .replace(/\{(?!")([^}"]*[()=*/^][^}"]*)\}/g, (_, inner) => `{"${inner}"}`)
  );
}

export default function MermaidDiagram({ code }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code?.trim()) return;
    let cancelled = false;

    (async () => {
      const clean = sanitize(code.trim());
      try {
        const valid = await mermaid.parse(clean, { suppressErrors: true });
        if (cancelled) return;
        if (!valid) { setError(true); setSvg(""); return; }
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { svg: rendered } = await mermaid.render(id, clean);
        if (cancelled) return;
        setSvg(rendered);
        setError(null);
      } catch {
        if (!cancelled) { setError(true); setSvg(""); }
      }
    })();

    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <pre className="my-2 overflow-x-auto rounded-lg bg-black/5 dark:bg-white/10 p-3 text-xs font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
        {code}
      </pre>
    );
  }

  if (!svg) return null;

  return (
    <div
      className="my-3 overflow-x-auto rounded-lg [&>svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
