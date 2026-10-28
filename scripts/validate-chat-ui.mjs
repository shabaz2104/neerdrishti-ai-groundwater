import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  const absolutePath = resolve(root, relativePath);
  assert.ok(existsSync(absolutePath), `missing chat UI file: ${relativePath}`);
  return readFileSync(absolutePath, "utf8");
}

const pageSource = read("app/app/chat/page.tsx");
const clientSource = read("app/app/chat/chat-client.tsx");
const markdownSource = read("app/app/chat/chat-markdown.tsx");
const docsSource = read("docs/local-ai-engine.md");

assert.match(pageSource, /ChatClient/);
assert.match(clientSource, /fetch\("\/api\/chat"/);
assert.doesNotMatch(clientSource, /localhost:11434|OLLAMA_BASE_URL|OLLAMA_MODEL/);
assert.doesNotMatch(clientSource, /GEMINI|gemini|@google/i);
assert.match(clientSource, /grounded/);
assert.match(clientSource, /response\.source/);
assert.match(clientSource, /response\.year/);
assert.match(clientSource, /response\.toolsUsed/);
assert.match(clientSource, /Which assessment units in Pune have the highest extraction/);
assert.match(clientSource, /What is the groundwater classification distribution in Maharashtra/);
assert.match(clientSource, /Tell me about Indapur/);
assert.match(clientSource, /isLoading/);
assert.match(clientSource, /Retry/);
assert.match(clientSource, /clearChat/);
assert.match(clientSource, /textarea/);
assert.match(clientSource, /aria-live/);
assert.match(clientSource, /Grounded AI · 2024 groundwater data · no chat history saved/);
assert.doesNotMatch(clientSource, /Local model/);
assert.match(clientSource, /focus:ring/);
assert.doesNotMatch(clientSource, /dangerouslySetInnerHTML/);
assert.doesNotMatch(markdownSource, /dangerouslySetInnerHTML/);
assert.doesNotMatch(clientSource, /SUPABASE_SERVICE_ROLE_KEY|createClient/);
assert.match(docsSource, /\/app\/chat/);
assert.match(docsSource, /POST \/api\/chat/);

// Render the actual component with controlled in-memory messages to check the
// duplicate-message bug, without a browser session or database credentials.
const actualRequire = createRequire(import.meta.url);
let renderMessages = [];
let stateIndex = 0;
const renderReact = { ...React,
  useState: (initial) => [stateIndex++ === 0 ? renderMessages : initial, () => {}],
  useEffect: () => {}, useRef: () => ({ current: null }),
};
function loadComponent(source) {
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", compiled)((name) => name === "react" ? renderReact : name === "./chat-markdown" ? loadComponent(markdownSource) : actualRequire(name), compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
// Expose the private parser in the test's compiled copy only.
const clientModule = loadComponent(clientSource + "\nexport { parseGroundedResponse };\n");
const ChatClient = clientModule.default;
const response = { answer: "UNSUPPORTED_SENTINEL", grounded: false, source: "No data", year: null, toolsUsed: [], metadata: { dataScope: "2024", engine: "ollama", modelConfigured: true }, error: { code: "UNSUPPORTED_INTENT", message: "UNSUPPORTED_SENTINEL" } };
for (const engine of ["ollama", "hosted", "openrouter", "unconfigured"]) {
  assert.equal(clientModule.parseGroundedResponse({ ...response, metadata: { ...response.metadata, engine } }).metadata.engine, engine);
}
assert.equal(clientModule.parseGroundedResponse({ ...response, metadata: { ...response.metadata, engine: "unexpected" } }), null);
renderMessages = [{ id: "test", role: "assistant", content: response.answer, response }];
stateIndex = 0;
const unsupportedHtml = renderToStaticMarkup(React.createElement(ChatClient));
assert.equal(unsupportedHtml.split("UNSUPPORTED_SENTINEL").length - 1, 1, "unsupported explanations must appear exactly once");
const grounded = { ...response, answer: "GROUNDING_SENTINEL", grounded: true, source: "CURRENT_DATABASE_SOURCE", year: 2024, toolsUsed: ["getDistrictSummary"], error: undefined };
renderMessages = [{ id: "grounded", role: "assistant", content: grounded.answer, response: grounded }];
stateIndex = 0;
const groundedHtml = renderToStaticMarkup(React.createElement(ChatClient));
assert.ok(groundedHtml.includes("GROUNDING_SENTINEL"));
assert.ok(groundedHtml.includes("CURRENT_DATABASE_SOURCE"));

console.log("Chat UI validation passed.");
console.log("  API boundary, grounding metadata, prompts, loading/error states, clear chat, safe Markdown, and accessibility checks: passed");
console.log("  rendered unsupported text appears once; grounded content and source metadata are retained");
