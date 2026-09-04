import { describe, expect, test } from "../../fixtures/claude.js";
import { createActivity, createMaterial } from "../../lib/factory.js";
import {
  expectCodleCommand,
  findCodleInteraction,
  parseCodleOutput,
} from "../../lib/ndjson.js";

describe("scratch-activity-goal list", () => {
  test("스크래치 활동 목표 목록 조회", async ({ claude, factory }) => {
    const material = await createMaterial(factory);
    const scratchActivitiable = await factory.create("scratch_activity");
    // AIDEV-NOTE: activity 생성은 scratch_activity → material 간 소유자 연결에 필요.
    // 컨트롤러의 check_owner!가 scratch_activity.activity.material.user_id를 확인한다.
    await createActivity(factory, material.id, {
      name: "E2E Scratch Goal List",
      activitiableType: "ScratchActivity",
      activitiableId: scratchActivitiable.id,
    });

    // seed: 목표를 하나 생성해둔다
    const createResult = await claude.run(
      `스크래치 활동 ID "${scratchActivitiable.id}"에 목표를 생성해줘. content는 "목표: 리스트 테스트"로 하고 position은 0으로 해.`,
    );
    const createInteraction = findCodleInteraction(
      createResult.toolInteractions,
      "scratch-activity-goal create",
    );
    const created = parseCodleOutput<{ id: string }>(
      createInteraction!.result!,
    );

    const result = await claude.run(
      `스크래치 활동 ID "${scratchActivitiable.id}"의 목표 목록을 조회해줘.`,
    );

    expectCodleCommand(result, "scratch-activity-goal list");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "scratch-activity-goal list",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);

    const output = JSON.stringify(parseCodleOutput(interaction!.result!));
    expect(output).toContain(created.id);
  });
});
