import { describe, expect, test } from "../fixtures/cli.js";
import { createMaterial, createActivity } from "../lib/factory.js";
import { findLastCodleCommand } from "../lib/ndjson.js";

describe("cli: material search", () => {
  test("seed한 내 자료를 검색하는 올바른 커맨드 실행", async ({
    cli,
    factory,
  }) => {
    const uniqueName = `e2e-cli-${Date.now()}`;
    await createMaterial(factory, { name: uniqueName });

    const result = await cli.run(`내 자료 중 "${uniqueName}"을 검색해줘.`);

    const cmd = findLastCodleCommand(result.toolInteractions);
    expect(cmd).toBeDefined();
    expect(cmd).toMatch(/material\s+search/);
    expect(cmd).toContain(uniqueName);
  });
});

describe("cli: material get", () => {
  test("자료 상세 조회 커맨드에 자료 ID 포함", async ({ cli, factory }) => {
    const material = await createMaterial(factory);

    const result = await cli.run(
      `자료 ID "${material.id}"의 상세 정보를 조회해줘.`,
    );

    const cmd = findLastCodleCommand(result.toolInteractions);
    expect(cmd).toBeDefined();
    expect(cmd).toMatch(/material\s+get/);
    expect(cmd).toContain(material.id);
  });
});

describe("cli: material create", () => {
  test("자료 생성 커맨드에 이름 포함", async ({ cli }) => {
    const materialName = `E2E CLI ${Date.now()}`;

    const result = await cli.run(
      `"${materialName}" 이름으로 새 자료를 만들어줘.`,
    );

    const cmd = findLastCodleCommand(result.toolInteractions);
    expect(cmd).toBeDefined();
    expect(cmd).toMatch(/material\s+create/);
    expect(cmd).toContain(materialName);
  });
});
