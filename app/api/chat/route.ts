import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth.server";
import { answerGroundwaterQuestion } from "@/lib/ai/local-groundwater-engine.server";
import { isChatRequestBody, readChatRequestBody } from "@/lib/ai/chat-request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestStart = performance.now();
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication is required to use the groundwater assistant." },
        { status: 401 },
      );
    }

    const bodyResult = await readChatRequestBody(request);
    if (!bodyResult.ok) {
      return NextResponse.json(
        { error: bodyResult.reason === "too_large" ? "The chat request is too large." : "Request body must be valid JSON." },
        { status: bodyResult.reason === "too_large" ? 413 : 400 },
      );
    }
    const body = bodyResult.value;

    if (!isChatRequestBody(body)) {
      return NextResponse.json(
        { error: "Send a message of up to 2,000 characters and at most four recent user questions." },
        { status: 400 },
      );
    }

    const result = await answerGroundwaterQuestion(body.message, body.history ?? []);
    const timings = result.metadata.timings;
    const serverTiming = timings ? `intent;dur=${timings.intent_ms}, db;dur=${timings.db_ms}, generation;dur=${timings.generation_ms}, total;dur=${(performance.now() - requestStart).toFixed(1)}` : "";
    return NextResponse.json(result, { headers: { "Server-Timing": serverTiming } });
  } catch {
    return NextResponse.json(
      { error: "The groundwater assistant is temporarily unavailable." },
      { status: 500 },
    );
  }
}
