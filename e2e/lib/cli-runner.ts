import { spawn } from "node:child_process";
import { resolve } from "node:path";
import {
  parseNdjson,
  type ClaudeResult,
  type UsageStats,
} from "./ndjson.js";

interface CliRunnerOptions {
  projectDir: string;
  accessToken: string;
  maxBudgetUsd: string;
}

export class CliRunner {
  private projectDir: string;
  private accessToken: string;
  private maxBudgetUsd: string;
  lastPrompt = "";
  lastResult: ClaudeResult | undefined;
  lastCostUsd = 0;
  lastDurationMs = 0;
  lastNumTurns = 0;
  lastToolCallCount = 0;
  lastUsage: UsageStats = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
  };

  constructor(opts: CliRunnerOptions) {
    this.projectDir = opts.projectDir;
    this.accessToken = opts.accessToken;
    this.maxBudgetUsd = opts.maxBudgetUsd;
  }

  async run(
    prompt: string,
    opts?: { timeout?: number },
  ): Promise<ClaudeResult> {
    this.lastPrompt = prompt;
    const timeout = opts?.timeout ?? 120_000;
    const binPath = resolve(this.projectDir, "bin", "run.js");

    const systemPrompt = [
      "You have access to a CLI tool called `codle`.",
      `The binary is at: ${binPath}`,
      `Use --token ${this.accessToken} for authentication.`,
      "Run `node ${binPath} --help` to discover available commands.",
      "Run `node ${binPath} <topic> --help` to see subcommands.",
      "Run `node ${binPath} <topic> <command> --help` to see command flags.",
      "Always use `node ${binPath}` to invoke the CLI.",
    ].join("\n");

    return new Promise<ClaudeResult>((resolve, reject) => {
      const child = spawn(
        "claude",
        [
          "-p",
          prompt,
          "--output-format",
          "stream-json",
          "--verbose",
          "--system-prompt",
          systemPrompt,
          "--allowed-tools",
          "Bash",
          "--max-budget-usd",
          this.maxBudgetUsd,
          "--no-session-persistence",
          "--model",
          process.env.E2E_MODEL || "sonnet",
        ],
        {
          cwd: this.projectDir,
          env: { ...process.env, CLAUDECODE: undefined },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
      child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        reject(new Error(`Claude timed out after ${timeout}ms`));
      }, timeout);

      child.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        const stdout = Buffer.concat(stdoutChunks).toString("utf-8");
        const stderr = Buffer.concat(stderrChunks).toString("utf-8");
        const result = parseNdjson(stdout, code ?? 1, stderr);
        this.lastResult = result;
        this.lastCostUsd = result.costUsd;
        this.lastDurationMs = result.durationMs;
        this.lastNumTurns = result.numTurns;
        this.lastToolCallCount = result.toolCalls.length;
        this.lastUsage = result.usage;
        resolve(result);
      });
    });
  }
}
