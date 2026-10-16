import ChatClient from "./chat-client";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ prompt?: string | string[] }> }) {
  const params = await searchParams;
  const prompt = Array.isArray(params.prompt) ? params.prompt[0] : params.prompt;
  const initialPrompt = typeof prompt === "string" ? prompt.slice(0, 2_000) : "";
  return <ChatClient initialPrompt={initialPrompt} />;
}
