"use client";

import { FormEvent, memo, useEffect, useRef, useState } from "react";

import ChatMarkdown from "./chat-markdown";

const SUGGESTED_PROMPTS = [
  "Which assessment units in Pune have the highest extraction?",
  "What is the groundwater classification distribution in Maharashtra?",
  "Tell me about Indapur.",
  "What are the groundwater resources in Pune?",
  "Which districts have the highest groundwater extraction?",
] as const;

type GroundedResponse = {
  answer: string;
  grounded: boolean;
  source: string;
  year: number | null;
  toolsUsed: string[];
  metadata: {
    dataScope: "2024";
    engine: "ollama" | "hosted" | "openrouter" | "unconfigured";
    modelConfigured: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
};

type ChatMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; content: string; response: GroundedResponse };

type ApiErrorPayload = { error?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseGroundedResponse(value: unknown): GroundedResponse | null {
  if (!isRecord(value) || typeof value.answer !== "string" || typeof value.grounded !== "boolean") {
    return null;
  }

  if (
    typeof value.source !== "string" ||
    (value.year !== null && typeof value.year !== "number") ||
    !Array.isArray(value.toolsUsed) ||
    value.toolsUsed.some((tool) => typeof tool !== "string") ||
    !isRecord(value.metadata) ||
    value.metadata.dataScope !== "2024" ||
    !["ollama", "hosted", "openrouter", "unconfigured"].includes(String(value.metadata.engine)) ||
    typeof value.metadata.modelConfigured !== "boolean"
  ) {
    return null;
  }

  if (
    value.error !== undefined &&
    (!isRecord(value.error) ||
      typeof value.error.code !== "string" ||
      typeof value.error.message !== "string")
  ) {
    return null;
  }

  return {
    answer: value.answer,
    grounded: value.grounded,
    source: value.source,
    year: value.year,
    toolsUsed: value.toolsUsed as string[],
    metadata: {
      dataScope: "2024",
      engine: value.metadata.engine as GroundedResponse["metadata"]["engine"],
      modelConfigured: value.metadata.modelConfigured,
    },
    error:
      value.error === undefined
        ? undefined
        : {
            code: value.error.code as string,
            message: value.error.message as string,
          },
  };
}

function readApiError(value: unknown) {
  if (isRecord(value) && typeof (value as ApiErrorPayload).error === "string") {
    return (value as ApiErrorPayload).error as string;
  }
  return null;
}

function formatToolName(value: string) {
  return value
    .replace(/^get/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function makeMessageId(role: "user" | "assistant") {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function GroundedBadge() {
  return (
    <span className="nd-grounded inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold">
      <span aria-hidden="true">✓</span>
      Grounded in NeerDrishti 2024 groundwater data
    </span>
  );
}

function SourcePanel({ response }: { response: GroundedResponse }) {
  if (!response.grounded) {
    return null;
  }

  return (
    <dl className="nd-chat-meta mt-5 grid gap-3 pt-4 text-xs sm:grid-cols-3">
      <div>
        <dt className="font-semibold uppercase tracking-[0.12em] text-slate-400">Source</dt>
        <dd className="mt-1 leading-5 text-slate-600">{response.source}</dd>
      </div>
      <div>
        <dt className="font-semibold uppercase tracking-[0.12em] text-slate-400">Year</dt>
        <dd className="mt-1 leading-5 text-slate-600">{response.year ?? "Not specified"}</dd>
      </div>
      <div>
        <dt className="font-semibold uppercase tracking-[0.12em] text-slate-400">Tools used</dt>
        <dd className="mt-1 leading-5 text-slate-600">
          {response.toolsUsed.length > 0
            ? response.toolsUsed.map(formatToolName).join(" · ")
            : "None reported"}
        </dd>
      </div>
    </dl>
  );
}

const AssistantMessage = memo(function AssistantMessage({ response }: { response: GroundedResponse }) {
  return (
    <article className="flex items-start gap-3" aria-label="NeerDrishti assistant response">
      <div
        aria-hidden="true"
        className="nd-chat-avatar flex h-9 w-9 shrink-0 items-center justify-center text-sm font-bold text-white shadow-sm"
      >
        N
      </div>
      <div className="nd-assistant-bubble min-w-0 max-w-3xl break-words border px-4 py-4 text-sm leading-7 text-slate-700 sm:px-6">
        {response.error && (
          <p className="nd-alert-warning mb-4 rounded-xl border px-3 py-2 text-sm leading-6">
            {response.error.message}
          </p>
        )}
        {(!response.error || response.error.message.trim() !== response.answer.trim()) && <ChatMarkdown content={response.answer} />}
        <div className="mt-5 flex flex-wrap gap-2">
          {response.grounded && <GroundedBadge />}
          {!response.grounded && !response.error && (
            <span className="text-xs text-slate-500">Not verified against a groundwater data result.</span>
          )}
        </div>
        <SourcePanel response={response} />
      </div>
    </article>
  );
});

const UserMessage = memo(function UserMessage({ content }: { content: string }) {
  return (
    <article className="flex justify-end" aria-label="Your question">
      <div className="nd-user-bubble max-w-2xl break-words px-4 py-3 text-sm leading-6 text-white shadow-sm sm:px-5">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </article>
  );
});

function LoadingMessage() {
  return (
    <div className="flex items-start gap-3" aria-live="polite" role="status">
      <div aria-hidden="true" className="nd-chat-avatar flex h-9 w-9 shrink-0 items-center justify-center text-sm font-bold text-white">
        N
      </div>
      <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        <span>Checking NeerDrishti groundwater data</span>
        <span className="ml-1 inline-flex gap-0.5" aria-hidden="true">
          <span className="animate-pulse">·</span>
          <span className="animate-pulse [animation-delay:150ms]">·</span>
          <span className="animate-pulse [animation-delay:300ms]">·</span>
        </span>
      </div>
    </div>
  );
}

export default function ChatClient({ initialPrompt = "" }: { initialPrompt?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
  const endOfConversationRef = useRef<HTMLDivElement>(null);
  const requestLock = useRef(false);

  useEffect(() => {
    endOfConversationRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" });
  }, [messages, isLoading, requestError]);

  async function submitQuestion(rawQuestion: string) {
    const question = rawQuestion.trim();
    if (!question || isLoading || requestLock.current) {
      return;
    }

    requestLock.current = true;

    setMessages((current) => [
      ...current,
      { id: makeMessageId("user"), role: "user", content: question },
    ]);
    setInput("");
    setRequestError(null);
    setLastFailedQuestion(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: question, history: messages.filter((message) => message.role === "user").slice(-4).map((message) => message.content) }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Please sign in again to use the groundwater assistant."
            : readApiError(payload) ??
                "NeerDrishti's AI service is currently unavailable. Please try again.",
        );
      }

      const result = parseGroundedResponse(payload);
      if (!result) {
        throw new Error("The assistant returned an unexpected response. Please try again.");
      }

      setMessages((current) => [
        ...current,
        { id: makeMessageId("assistant"), role: "assistant", content: result.answer, response: result },
      ]);
    } catch (error: unknown) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "NeerDrishti's AI service is currently unavailable. Please try again.",
      );
      setLastFailedQuestion(question);
    } finally {
      requestLock.current = false;
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion(input);
  }

  function clearChat() {
    setMessages([]);
    setInput("");
    setRequestError(null);
    setLastFailedQuestion(null);
  }

  const hasMessages = messages.length > 0;

  return (
    <section aria-labelledby="chat-title" className="nd-page nd-chat">
      <header className="nd-page-header">
        <div>
          <p className="nd-eyebrow">NeerDrishti AI Assistant</p>
          <h1 className="nd-page-title" id="chat-title">
            Your Groundwater Research Assistant
          </h1>
          <p className="nd-page-description">
            Explore the current structured assessment data with an AI assistant grounded in NeerDrishti’s 2024 groundwater records.
          </p>
        </div>
        {hasMessages && (
          <button
            className="nd-button-secondary inline-flex min-h-10 w-fit items-center px-4 py-2 text-sm font-semibold transition"
            onClick={clearChat}
            disabled={isLoading}
            type="button"
          >
            Clear chat
          </button>
        )}
      </header>

      <div className="nd-chat-shell">
        <div className="nd-chat-topbar flex flex-col justify-between gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:px-7">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="nd-chat-avatar flex h-10 w-10 items-center justify-center font-bold text-white">N</span>
            <div>
              <p className="font-semibold text-slate-900">NeerDrishti assistant</p>
              <p className="text-xs text-slate-500">Grounded AI · 2024 groundwater data · no chat history saved</p>
            </div>
          </div>
          <span className="nd-grounded inline-flex w-fit px-3 py-1.5 text-xs font-semibold">
            Groundwater data · 2024
          </span>
        </div>

        <div aria-busy={isLoading} className="nd-chat-thread min-h-[25rem] space-y-5 overflow-y-auto px-4 py-6 sm:px-7 sm:py-8">
          {!hasMessages ? (
            <div className="mx-auto flex min-h-[21rem] max-w-2xl flex-col items-center justify-center text-center">
              <span aria-hidden="true" className="nd-chat-avatar flex h-16 w-16 items-center justify-center text-2xl font-bold text-white shadow-sm">N</span>
              <h2 className="nd-chat-empty-title mt-5">What would you like to explore?</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                Ask a question about districts, assessment units, recharge, extraction, availability, or classification. Numerical answers are grounded in NeerDrishti data when the assistant can verify them.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Suggested groundwater questions">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    className="nd-chip nd-chat-prompt px-3.5 py-2 text-left font-medium transition"
                    key={prompt}
                    onClick={() => void submitQuestion(prompt)}
                    type="button"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) =>
              message.role === "user" ? (
                <UserMessage content={message.content} key={message.id} />
              ) : (
                <AssistantMessage response={message.response} key={message.id} />
              ),
            )
          )}
          {isLoading && <LoadingMessage />}
          <div ref={endOfConversationRef} />
        </div>

        <div className="nd-chat-composer border-t p-4 sm:p-6">
          {requestError && (
            <div className="nd-alert-error mb-4 flex flex-col justify-between gap-3 rounded-xl border px-4 py-3 text-sm leading-6 sm:flex-row sm:items-center" role="alert">
              <span>{requestError}</span>
              {lastFailedQuestion && (
                <button
                  className="inline-flex min-h-9 w-fit items-center rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                  onClick={() => void submitQuestion(lastFailedQuestion)}
                  type="button"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {hasMessages && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Suggested follow-up questions">
              {SUGGESTED_PROMPTS.slice(0, 3).map((prompt) => (
                <button
                  className="nd-chip shrink-0 px-3 py-1.5 text-xs font-medium transition"
                  key={prompt}
                  onClick={() => void submitQuestion(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSubmit}>
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor="chat-message">Ask NeerDrishti something</label>
              <textarea
                aria-describedby="chat-unit-note"
                className="nd-control min-h-12 w-full resize-y px-4 py-3 text-sm leading-6 transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoading}
                id="chat-message"
                maxLength={2_000}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Ask about Maharashtra groundwater data…"
                rows={2}
                value={input}
              />
              <p className="mt-2 text-xs text-slate-500" id="chat-unit-note">
                Resource and extraction values remain in ha-m. Shift + Enter adds a new line.
              </p>
            </div>
            <button
              className="nd-button-primary inline-flex min-h-12 items-center justify-center px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading || input.trim().length === 0}
              type="submit"
            >
              {isLoading ? "Checking…" : "Send"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
