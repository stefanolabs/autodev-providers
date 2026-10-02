import { describe, it, expect } from "vitest";
import provider from "../src/index.js";

/** A host that records the argv instead of starting codex — the same shape AutoDev hands over. */
function host(over: Record<string, unknown> = {}) {
  const calls: string[][] = [];
  return {
    calls,
    host: {
      binary: "codex", platform: "linux", mcp: null, pin: null,
      runner: async (_cmd: string, args: string[]) => { calls.push(args); return { stdout: "", stderr: "", exitCode: 0 }; },
      ...over,
    },
  };
}

const THREAD_STARTED = JSON.stringify({ type: "thread.started", thread_id: "t-123" });

describe("template-codex", () => {
  it("returns the session id codex printed, and ok on exit 0", async () => {
    const h = host({ runner: async () => ({ stdout: `noise\n${THREAD_STARTED}\n`, stderr: "", exitCode: 0 }) });
    expect(await provider.create({}, h.host as never).execute("hi")).toMatchObject({ ok: true, sessionId: "t-123" });
  });

  it("resumes the session it is given", async () => {
    const h = host();
    await provider.create({}, h.host as never).execute("hi", { sessionId: "t-9" });
    expect(h.calls[0]).toEqual(expect.arrayContaining(["resume", "t-9"]));
  });

  it("reports a failed exit and a runner that throws as failures, never as success", async () => {
    const exit1 = host({ runner: async () => ({ stdout: "", stderr: "boom", exitCode: 1 }) });
    expect(await provider.create({}, exit1.host as never).execute("hi")).toMatchObject({ ok: false, exitCode: 1 });
    const threw = host({ runner: async () => { throw new Error("spawn failed"); } });
    expect(await provider.create({}, threw.host as never).execute("hi")).toMatchObject({ ok: false, stderr: "spawn failed" });
  });

  it("answers availability from --version, and auth as unknown", async () => {
    const h = host();
    const p = provider.create({}, h.host as never);
    expect(await p.isAvailable()).toBe(true);
    expect(h.calls[0]).toEqual(["--version"]);
    expect(await p.authStatus()).toEqual({ known: false });
    expect(p.detectRateLimit("anything")).toBeNull();
  });

  it("passes a pinned model and effort through verbatim", async () => {
    const h = host({ pin: { model: "gpt-x", effort: "high" } });
    await provider.create({}, h.host as never).execute("hi");
    expect(h.calls[0]).toEqual(expect.arrayContaining(["-m", "gpt-x", "-c", "model_reasoning_effort=high"]));
  });

  it("adds AutoDev's MCP server only on a participant call", async () => {
    const bare = host();
    await provider.create({}, bare.host as never).execute("hi");
    expect(bare.calls[0].join(" ")).not.toContain("mcp_servers");
    const part = host({ mcp: { name: "autodev", command: "node", args: ["cli.js", "mcp"], file: null } });
    await provider.create({}, part.host as never).execute("hi");
    expect(part.calls[0].join(" ")).toContain("mcp_servers.autodev.command");
  });
});
