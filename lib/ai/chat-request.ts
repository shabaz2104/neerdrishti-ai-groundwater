import { MAX_CONTEXT_QUESTIONS } from "./groundwater-conversation.ts";

export type ChatRequestBody = { message: string; history?: string[] };
export const CHAT_MAX_MESSAGE_CHARS = 2_000;
export const CHAT_MAX_REQUEST_BYTES = 64 * 1024;

export type ChatBodyReadResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "invalid" | "too_large" };

/** Read even chunked bodies with a hard byte ceiling before JSON parsing. */
export async function readChatRequestBody(request: Request): Promise<ChatBodyReadResult> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") return { ok: false, reason: "invalid" };

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const parsedLength = Number(contentLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) return { ok: false, reason: "invalid" };
    if (parsedLength > CHAT_MAX_REQUEST_BYTES) return { ok: false, reason: "too_large" };
  }

  if (!request.body) return { ok: false, reason: "invalid" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > CHAT_MAX_REQUEST_BYTES) {
        await reader.cancel();
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, reason: "invalid" };
  } finally {
    reader.releaseLock();
  }
}

/** History is bounded, untrusted user text. Assistant prose and arbitrary fields are rejected. */
export function isChatRequestBody(value: unknown): value is ChatRequestBody {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const validMessage = (message: unknown) => typeof message === "string" && message.trim().length > 0 && message.length <= CHAT_MAX_MESSAGE_CHARS;
  return Object.keys(record).every((key) => key === "message" || key === "history") && validMessage(record.message) &&
    (record.history === undefined || (Array.isArray(record.history) && record.history.length <= MAX_CONTEXT_QUESTIONS && record.history.every(validMessage)));
}
