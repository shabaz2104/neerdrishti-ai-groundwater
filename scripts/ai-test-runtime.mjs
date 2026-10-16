import { registerHooks } from "node:module";

// CLI validators run trusted server code outside Next's bundler. Only this
// marker is replaced; deployed builds retain Next's server-only import guard.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") return { url: "data:text/javascript,export%20%7B%7D", shortCircuit: true };
  return nextResolve(specifier, context);
} });
