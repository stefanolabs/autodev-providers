// The template provider: the smallest real provider, driving OpenAI's codex CLI.
// Copy this folder to start your own. Everything AutoDev needs from a provider is in this file.
//
// Two rules shape every line (the gate enforces both):
//   - A provider imports only the kit's light entry below. It has no fs, no fetch, no process:
//     it cannot reach the network, and it builds into one file that AutoDev can pin by hash.
//   - It starts exactly one program, its CLI (`binary`), and only through `host.runner`.
import { defineProvider, jsonLines } from "@stefanolabs/autodev-provider-kit/provider";

export default defineProvider({
  apiVersion: 1,
  // A stable lowercase tag: how people install it (`autodev providers add template-codex`).
  name: "template-codex",
  // The program this provider runs. AutoDev resolves it on the person's machine.
  binary: "codex",
  // Declared from captures only. `false` means "not verified", never "absent": claim a capability
  // only when one of your captures/ shows the CLI doing it, because the contract checks each claim.
  capabilities: {
    liveEvents: false, structuralRateLimit: false, textRateLimit: "unknown", structuralCompaction: false,
    sessionIdSource: "from-stream", readOnlyExecution: false, concurrentCallsSameWorkspace: false,
    perCallBudget: false, usdReporting: false, tokenReporting: false, reportsModel: false,
    quotaReporting: false, manualCompaction: false, sessionFork: false, authStatus: false,
    threadTools: "config-override", autocompactWindow: false, turnVerdict: false, inferenceCount: false,
    contextPerInference: false, sandboxWritableRoots: false, standingInstructions: false,
  },

  // Called once per participant. `host` is everything AutoDev hands you: the runner, the binary's
  // resolved path, the participant's pin, and AutoDev's MCP server on a participant call.
  create: (_cfg, host) => ({
    name: "template-codex",

    async execute(prompt, opts = {}) {
      const args = ["exec", "--json", "--skip-git-repo-check"];

      // The pin: the model and effort the person chose for this participant. Free-form strings,
      // passed through verbatim. Never validate them: a list of models is wrong the day one ships.
      if (host.pin?.model) args.push("-m", host.pin.model);
      if (host.pin?.effort) args.push("-c", "model_reasoning_effort=" + host.pin.effort);

      // AutoDev's MCP server, present only on a participant call: it is how the agent reaches the
      // shared thread. Add it ALONGSIDE the person's own servers (codex's `-c` is additive). Never
      // use a flag that replaces their MCP configuration.
      if (host.mcp) {
        args.push(
          "-c", "mcp_servers." + host.mcp.name + ".command=" + JSON.stringify(host.mcp.command),
          "-c", "mcp_servers." + host.mcp.name + ".args=" + JSON.stringify(host.mcp.args),
          // `codex exec` runs with approval policy "never": a tool that is not pre-approved is refused,
          // and the turn ends ok with no post. Pre-approve only AutoDev's tools, not the person's.
          "-c", "mcp_servers." + host.mcp.name + '.default_tools_approval_mode="approve"',
        );
      }

      // Resume: AutoDev hands back the session id this provider returned last time, so the agent
      // keeps its context across turns.
      if (opts.sessionId) args.push("resume", opts.sessionId);

      // codex reads the prompt from stdin when given "-". The runner writes `prompt` there and
      // closes the pipe, so the CLI never waits on an open stdin.
      args.push("-");

      // A runner that fails (the CLI is missing, it was killed) is a failed turn, never a throw.
      let r;
      try {
        r = await host.runner(host.binary, args, undefined, prompt);
      } catch (e) {
        return { ok: false, stdout: "", stderr: e instanceof Error ? e.message : String(e), exitCode: 1, rateLimit: null };
      }

      // codex prints one JSON event per line; `thread.started` carries the id to resume with.
      const started = jsonLines(r.stdout).find(
        (e): e is { type: string; thread_id: string } =>
          typeof e === "object" && e !== null && (e as { type?: unknown }).type === "thread.started",
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
        sessionId: started ? started.thread_id : null,
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
      return { known: false as const };
    },
  }),
});
