import { describe, expect, test } from "../../fixtures/claude.js";
import {
  expectCodleCommand,
  findCodleInteraction,
  parseCodleOutput,
} from "../../lib/ndjson.js";

describe("tag search", () => {
  test("도메인별 태그 조회", async ({ claude }) => {
    const result = await claude.run(" 'material' 도메인의 태그를 검색해줘.");

    expectCodleCommand(result, "tag search");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "tag search",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);

    const output = parseCodleOutput<unknown[]>(interaction!.result!);
    expect(Array.isArray(output)).toBe(true);
  });

  // AIDEV-NOTE: 유효하지 않은 domain 거부는 unit test에서 검증한다.
  // e2e에서는 AI가 --help로 valid options를 확인한 뒤 invalid 값을 전달하지 않아
  // 비결정적으로 실패한다. 또한 BaseCommand.catch()가 exit 0으로 종료하므로
  // isError도 false가 되어 이중으로 검증이 불가능하다.

  test("키워드 검색", async ({ claude }) => {
    const result = await claude.run(" '파이썬' 관련 태그를 검색해줘.");

    expectCodleCommand(result, "tag search");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "tag search",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);

    const output = parseCodleOutput<unknown[]>(interaction!.result!);
    expect(Array.isArray(output)).toBe(true);
  });
});
