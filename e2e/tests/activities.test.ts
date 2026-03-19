import { describe, expect, test } from "../fixtures/cli.js";
import { createMaterial, createActivity } from "../lib/factory.js";
import { findLastCodleCommand } from "../lib/ndjson.js";

describe("cli: activity create", () => {
  test("활동 생성 커맨드에 자료 ID와 이름 포함", async ({ cli, factory }) => {
    const material = await createMaterial(factory);
    const actName = `e2e-cli-act-${Date.now()}`;

    const result = await cli.run(
      `자료 "${material.id}"에 "${actName}" 이름으로 board 활동을 추가해줘.`,
    );

    const cmd = findLastCodleCommand(result.toolInteractions);
    expect(cmd).toBeDefined();
    expect(cmd).toMatch(/activity\s+create/);
    expect(cmd).toContain(material.id);
    expect(cmd).toContain(actName);
  });
});

describe("cli: activity delete", () => {
  test("활동 삭제 커맨드에 활동 ID 포함", async ({ cli, factory }) => {
    const material = await createMaterial(factory);
    const activity = await createActivity(factory, material.id);

    const result = await cli.run(`활동 ID "${activity.id}"를 삭제해줘.`);

    const cmd = findLastCodleCommand(result.toolInteractions);
    expect(cmd).toBeDefined();
    expect(cmd).toMatch(/activity\s+delete/);
    expect(cmd).toContain(activity.id);
  });
});
