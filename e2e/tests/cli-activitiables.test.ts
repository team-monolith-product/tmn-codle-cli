import { describe, expect, test } from "../fixtures/cli.js";
import { createActivity, createMaterial } from "../lib/factory.js";
import { findLastCodleCommand } from "../lib/ndjson.js";

describe("cli: activitiable update", () => {
  test("보드 안내문 설정 커맨드에 활동 ID 포함", async ({ cli, factory }) => {
    const material = await createMaterial(factory);
    const activity = await createActivity(factory, material.id);

    const result = await cli.run(
      `활동 ID "${activity.id}"의 보드 안내문을 "안녕하세요"로 설정해줘.`,
    );

    const cmd = findLastCodleCommand(result.toolInteractions);
    expect(cmd).toBeDefined();
    expect(cmd).toMatch(/activitiable\s+update/);
    expect(cmd).toContain(activity.id);
  });
});
