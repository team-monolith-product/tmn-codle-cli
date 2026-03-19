import { describe, expect, test } from "../fixtures/cli.js";
import { findLastCodleCommand } from "../lib/ndjson.js";

describe("cli: docs sheet-directives", () => {
  test("활동지 directive 가이드 조회 커맨드 실행", async ({ cli }) => {
    const result = await cli.run(
      "활동지 입력란에 사용할 수 있는 directive 문법을 알려줘.",
    );

    const cmd = findLastCodleCommand(result.toolInteractions);
    expect(cmd).toBeDefined();
    expect(cmd).toMatch(/docs\s+sheet-directives/);
  });
});
