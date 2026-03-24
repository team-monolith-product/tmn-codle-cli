import { spawn } from "node:child_process";
import { dirname } from "node:path";
import { parseNdjson, type ClaudeResult, type UsageStats } from "./ndjson.js";

interface ClaudeRunnerOptions {
  accessToken: string;
  codleBin: string;
  projectDir: string;
  maxBudgetUsd: string;
}

export class ClaudeRunner {
  private accessToken: string;
  private codleBin: string;
  private projectDir: string;
  private maxBudgetUsd: string;
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

  constructor(opts: ClaudeRunnerOptions) {
    this.accessToken = opts.accessToken;
    this.codleBin = opts.codleBin;
    this.projectDir = opts.projectDir;
    this.maxBudgetUsd = opts.maxBudgetUsd;
  }

  async run(
    prompt: string,
    opts?: { timeout?: number },
  ): Promise<ClaudeResult> {
    const timeout = opts?.timeout ?? 120_000;
    const codleBinDir = dirname(this.codleBin);

    // AIDEV-NOTE: Claude에게 codle CLI의 존재와 사용법을 알려줘야 한다.
    // --allowed-tools만으로는 CLI의 존재를 알 수 없으므로 프롬프트에 context를 주입한다.
    // 구체적인 커맨드 구조를 제공하여 --help 탐색 없이 바로 실행하도록 유도한다.
    const systemPrompt =
      `You have the "codle" CLI. Authentication is already configured. Output is JSON. ` +
      `Commands: codle material search|get|create|update|duplicate, ` +
      `codle activity create|update|delete|duplicate|set-flow|set-branch, ` +
      `codle activitiable update, codle problem create|update|delete, ` +
      `codle problem-collection sync, codle tag search, ` +
      `codle html-activity-page sync, codle docs sheet-directives. ` +
      `Use --help on any command to see flags. Do not explore the codebase.`;

    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    return new Promise<ClaudeResult>((resolve, reject) => {
      const child = spawn(
        "claude",
        [
          "-p",
          fullPrompt,
          "--output-format",
          "stream-json",
          "--verbose",
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
          env: {
            ...process.env,
            CLAUDECODE: undefined,
            PATH: `${codleBinDir}:${process.env.PATH ?? ""}`,
          },
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
