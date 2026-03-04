import { describe, expect, test } from "../fixtures/claude.js";
import { createActivity, createMaterial } from "../lib/factory.js";
import { extractText, findToolResult } from "../lib/ndjson.js";

describe("materials", () => {
  // [Single Tool Contract] search_materials의 내 자료 검색 계약
  // [Contrastive Seeding] 유니크 이름으로 seed → 결과에 포함 확인
  test("search_materials로 내 자료 검색", async ({ claude, factory }) => {
    const uniqueName = `e2e-mine-${Date.now()}`;
    await createMaterial(factory, { name: uniqueName });

    const result = await claude.run("내 자료 목록을 보여줘.");

    expect(result.errors).toHaveLength(0);
    expect(result.toolNames).toContain("mcp__codle__search_materials");

    const interaction = findToolResult(
      result.toolInteractions,
      "mcp__codle__search_materials",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);
    const text = extractText(interaction!.result!);
    expect(text).toContain(uniqueName);
  });

  // [Single Tool Contract] search_materials의 공개 자료 검색 계약
  // [Contrastive Seeding] 내 자료(비공개)가 공개 검색에서 빠지는지 확인
  test("search_materials로 공개 자료 검색 시 내 자료 미포함", async ({
    claude,
    factory,
  }) => {
    const uniqueName = `e2e-not-public-${Date.now()}`;
    await createMaterial(factory, { name: uniqueName });

    const result = await claude.run("공개된 자료를 검색해줘.");

    expect(result.errors).toHaveLength(0);
    expect(result.toolNames).toContain("mcp__codle__search_materials");

    const interaction = findToolResult(
      result.toolInteractions,
      "mcp__codle__search_materials",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);
    const text = extractText(interaction!.result!);
    expect(text).not.toContain(uniqueName);
  });

  // [Single Tool Contract] get_material_detail의 핵심 계약: 자료 + 활동 포함 조회
  // [Contrastive Seeding] 활동이 있는 자료를 seed해서 활동 정보 포함 여부 확인
  test("get_material_detail로 자료와 활동 함께 조회", async ({
    claude,
    factory,
  }) => {
    const material = await createMaterial(factory);
    const activity = await createActivity(factory, material.id, {
      name: `e2e-activity-${Date.now()}`,
    });

    const result = await claude.run(
      `자료 ID "${material.id}"의 상세 정보를 조회해줘.`,
    );

    expect(result.errors).toHaveLength(0);
    expect(result.toolNames).toContain("mcp__codle__get_material_detail");

    const interaction = findToolResult(
      result.toolInteractions,
      "mcp__codle__get_material_detail",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);
    const text = extractText(interaction!.result!);
    expect(text).toContain(material.id);
    expect(text).toContain(activity.id);
  });

  // [Single Tool Contract] manage_materials create 계약만 검증
  // [Orthogonality] 조회는 위 테스트가 담당, 여기선 생성 성공만 확인
  test("manage_materials로 자료 생성", async ({ claude }) => {
    const materialName = `E2E Test ${Date.now()}`;
    const result = await claude.run(
      `"${materialName}" 이름으로 새 자료를 만들어줘.`,
    );

    expect(result.errors).toHaveLength(0);
    expect(result.toolNames).toContain("mcp__codle__manage_materials");

    const interaction = findToolResult(
      result.toolInteractions,
      "mcp__codle__manage_materials",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);
    const text = extractText(interaction!.result!);
    expect(text).toMatch(/자료 생성 완료/);
    expect(text).toContain(materialName);
  });
});
