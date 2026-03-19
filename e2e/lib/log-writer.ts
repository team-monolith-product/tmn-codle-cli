import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ClaudeResult, ToolInteraction } from "./ndjson.js";

const RESULTS_DIR = resolve(import.meta.dirname, "..", "results");

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9가-힣_-]/g, "_").slice(0, 100);
}

function formatInteraction(i: ToolInteraction): string {
  const input = JSON.stringify(i.call.input, null, 2);
  const resultContent = i.result
    ? i.result.isError
      ? `ERROR: ${i.result.content}`
      : i.result.content.slice(0, 500)
    : "(no result)";
  return `[${i.call.name}]\nInput: ${input}\nResult: ${resultContent}`;
}

export function writeTestLog(
  testName: string,
  prompt: string,
  result: ClaudeResult,
): void {
  mkdirSync(RESULTS_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${timestamp}_${sanitizeFilename(testName)}.log`;

  const lines = [
    `# ${testName}`,
    `Timestamp: ${new Date().toISOString()}`,
    `Prompt: ${prompt}`,
    `Cost: $${result.costUsd.toFixed(4)}`,
    `Duration: ${result.durationMs}ms`,
    `Turns: ${result.numTurns}`,
    `Tool calls: ${result.toolCalls.length}`,
    `Exit code: ${result.exitCode}`,
    "",
    "## Tool Interactions",
    "",
    ...result.toolInteractions.map(
      (i, idx) => `### ${idx + 1}. ${formatInteraction(i)}`,
    ),
    "",
    "## Final Text",
    result.text,
  ];

  writeFileSync(resolve(RESULTS_DIR, filename), lines.join("\n"), "utf-8");
}
