import { describe, expect, test } from "../fixtures/cli.js";
import { findLastCodleCommand } from "../lib/ndjson.js";

describe("cli: tag search", () => {
  test("태그 검색 커맨드 실행", async ({ cli }) => {
    const result = await cli.run("태그 중에 '수학' 관련 태그를 검색해줘.");

    const cmd = findLastCodleCommand(result.toolInteractions);
    expect(cmd).toBeDefined();
    expect(cmd).toMatch(/tag\s+search/);
  });
});
