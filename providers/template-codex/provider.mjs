// ../Autodev/packages/provider-kit/dist/types.js
function defineProvider(m) {
  return m;
}

// ../Autodev/packages/provider-kit/dist/helpers.js
function jsonLines(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed)
      continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch {
    }
  }
  return out;
}

// providers/template-codex/src/index.ts
var src_default = defineProvider({
  apiVersion: 1,
  // A stable lowercase tag: how people install it (`autodev providers add template-codex`).
  name: "template-codex",
  // The program this provider runs. AutoDev resolves it on the person's machine.
  binary: "codex",
  // Declared from captures only. `false` means "not verified", never "absent": claim a capability
  // only when one of your captures/ shows the CLI doing it, because the contract checks each claim.
  capabilities: {
    liveEvents: false,
    structuralRateLimit: false,
    textRateLimit: "unknown",
    structuralCompaction: false,
    sessionIdSource: "from-stream",
    readOnlyExecution: false,
    concurrentCallsSameWorkspace: false,
    perCallBudget: false,
    usdReporting: false,
    tokenReporting: false,
    reportsModel: false,
    quotaReporting: false,
    manualCompaction: false,
    sessionFork: false,
    authStatus: false,
    threadTools: "config-override",
    autocompactWindow: false,
    turnVerdict: false,
    inferenceCount: false,
    contextPerInference: false,
    sandboxWritableRoots: false,
    standingInstructions: false
  },
  // Called once per participant. `host` is everything AutoDev hands you: the runner, the binary's
  // resolved path, the participant's pin, and AutoDev's MCP server on a participant call.
  create: (_cfg, host) => ({
    name: "template-codex",
    async execute(prompt, opts = {}) {
      const args = ["exec", "--json", "--skip-git-repo-check"];
      if (host.pin?.model) args.push("-m", host.pin.model);
      if (host.pin?.effort) args.push("-c", "model_reasoning_effort=" + host.pin.effort);
      if (host.mcp) {
        args.push(
          "-c",
          "mcp_servers." + host.mcp.name + ".command=" + JSON.stringify(host.mcp.command),
          "-c",
          "mcp_servers." + host.mcp.name + ".args=" + JSON.stringify(host.mcp.args)
        );
      }
      if (opts.sessionId) args.push("resume", opts.sessionId);
      args.push("-");
      let r;
      try {
        r = await host.runner(host.binary, args, void 0, prompt);
      } catch (e) {
        return { ok: false, stdout: "", stderr: e instanceof Error ? e.message : String(e), exitCode: 1, rateLimit: null };
      }
      const started = jsonLines(r.stdout).find(
        (e) => typeof e === "object" && e !== null && e.type === "thread.started"
      );
      return {
        // Honest: ok only when the CLI said so with its exit code.
        ok: r.exitCode === 0,
        stdout: r.stdout,
        stderr: r.stderr,
        exitCode: r.exitCode,
        // This template does not detect limits. A provider that does returns them here: this field
        // is how AutoDev learns a limit was hit, and when to come back.
        rateLimit: null,
        sessionId: started ? started.thread_id : null
      };
    },
    // Is the CLI installed? Asked before a participant is offered.
    async isAvailable() {
      return (await host.runner(host.binary, ["--version"])).exitCode === 0;
    },
    // A sandboxed provider reports limits through `execute`'s result, so this stays null.
    detectRateLimit: () => null,
    // `known: false` means "cannot tell": AutoDev then lets the CLI's own terminal say whether it
    // is logged in, rather than guessing.
    async authStatus() {
      return { known: false };
    }
  })
});
export {
  src_default as default
};
