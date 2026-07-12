"use client";

import { useMemo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ============================================================
   Markdown renderer for companion replies: GFM (tables, lists,
   links), expandable code blocks with copy buttons, and a small
   original regex tokenizer for syntax highlighting (keeps the
   bundle tiny vs a full highlighter).
   ============================================================ */

const KEYWORDS =
  /\b(const|let|var|function|return|if|else|for|while|import|export|from|class|extends|new|await|async|type|interface|enum|switch|case|break|continue|try|catch|finally|throw|public|private|readonly|static|def|fn|match|impl|struct|use|mod|pub|print|lambda|yield|null|undefined|true|false|None|True|False)\b/g;

interface Token {
  text: string;
  cls?: string;
}

/** Original, tiny tokenizer: comments → strings → numbers → keywords. */
const tokenize = (code: string): Token[] => {
  const tokens: Token[] = [];
  // Order matters: comments and strings first so keywords inside them stay plain.
  const pattern =
    /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(\d+(?:\.\d+)?)\b/g;
  let last = 0;
  let match: RegExpExecArray | null;
  const pushPlain = (text: string) => {
    // Highlight keywords inside plain stretches.
    let kLast = 0;
    let k: RegExpExecArray | null;
    KEYWORDS.lastIndex = 0;
    while ((k = KEYWORDS.exec(text))) {
      if (k.index > kLast) tokens.push({ text: text.slice(kLast, k.index) });
      tokens.push({ text: k[0], cls: "text-pop" });
      kLast = k.index + k[0].length;
    }
    if (kLast < text.length) tokens.push({ text: text.slice(kLast) });
  };
  while ((match = pattern.exec(code))) {
    if (match.index > last) pushPlain(code.slice(last, match.index));
    if (match[1]) tokens.push({ text: match[1], cls: "text-fg-dim italic" });
    else if (match[2]) tokens.push({ text: match[2], cls: "text-[#8fd88f]" });
    else if (match[3]) tokens.push({ text: match[3], cls: "text-[#9ecbff]" });
    last = match.index + match[0].length;
  }
  if (last < code.length) pushPlain(code.slice(last));
  return tokens;
};

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const tokens = useMemo(() => tokenize(code), [code]);
  const lines = code.split("\n").length;
  const collapsible = lines > 10;

  const copy = () => {
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="group/code my-2 overflow-hidden border border-line bg-bg">
      <div className="flex items-center justify-between border-b border-line px-2.5 py-1">
        <span className="pixel-heading text-[9px] tracking-[0.2em] text-fg-dim">
          {(language || "code").toUpperCase()}
        </span>
        <div className="flex gap-1.5">
          {collapsible && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="focus-pixel cursor-pointer px-1.5 text-[10px] text-fg-dim hover:text-fg"
            >
              {expanded ? "▲ collapse" : `▼ ${lines} lines`}
            </button>
          )}
          <button
            type="button"
            onClick={copy}
            aria-label="Copy code"
            className="focus-pixel cursor-pointer px-1.5 text-[10px] text-fg-dim hover:text-pop"
          >
            {copied ? "✓ copied" : "⧉ copy"}
          </button>
        </div>
      </div>
      <pre
        className={`overflow-x-auto px-3 py-2 font-mono text-[11.5px] leading-relaxed ${
          collapsible && !expanded ? "max-h-[150px] overflow-y-hidden" : ""
        }`}
      >
        <code>
          {tokens.map((t, i) =>
            t.cls ? (
              <span key={i} className={t.cls}>
                {t.text}
              </span>
            ) : (
              t.text
            ),
          )}
        </code>
      </pre>
    </div>
  );
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-1.5 text-[12.5px] leading-relaxed [&_a]:text-pop [&_a]:underline [&_a]:underline-offset-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { className, children: kids } = props;
            const inline = !className && !String(kids).includes("\n");
            if (inline) {
              return (
                <code className="border border-line bg-bg px-1 py-0.5 font-mono text-[11px] text-pop">
                  {kids}
                </code>
              );
            }
            const language = /language-(\w+)/.exec(className ?? "")?.[1] ?? "";
            return <CodeBlock language={language} code={String(kids).replace(/\n$/, "")} />;
          },
          pre: ({ children: kids }) => <>{kids}</>,
          table: ({ children: kids }) => (
            <div className="overflow-x-auto">
              <table className="my-1 border-collapse text-[11.5px] [&_td]:border [&_td]:border-line [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-line [&_th]:bg-bg [&_th]:px-2 [&_th]:py-1 [&_th]:text-left">
                {kids}
              </table>
            </div>
          ),
          ul: ({ children: kids }) => <ul className="ml-4 list-disc space-y-0.5">{kids}</ul>,
          ol: ({ children: kids }) => <ol className="ml-4 list-decimal space-y-0.5">{kids}</ol>,
          h1: heading, h2: heading, h3: heading,
          a: ({ href, children: kids }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {kids}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

const heading = ({ children }: { children?: ReactNode }) => (
  <p className="pixel-heading mt-2 text-[13px] tracking-[0.08em] text-fg">{children}</p>
);
