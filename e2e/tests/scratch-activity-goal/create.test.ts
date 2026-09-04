import { describe, expect, test } from "../../fixtures/claude.js";
import { createActivity, createMaterial } from "../../lib/factory.js";
import {
  expectCodleCommand,
  findCodleInteraction,
  parseCodleOutput,
} from "../../lib/ndjson.js";

describe("scratch-activity-goal create", () => {
  test("스크래치 활동 목표 생성", async ({ claude, factory }) => {
    const material = await createMaterial(factory);
    const scratchActivitiable = await factory.create("scratch_activity");
    // AIDEV-NOTE: activity 생성은 scratch_activity → material 간 소유자 연결에 필요.
    // 컨트롤러의 check_owner!가 scratch_activity.activity.material.user_id를 확인한다.
    await createActivity(factory, material.id, {
      name: "E2E Scratch Goal Test",
      activitiableType: "ScratchActivity",
      activitiableId: scratchActivitiable.id,
    });

    const result = await claude.run(
      `스크래치 활동 ID "${scratchActivitiable.id}"에 목표를 생성해줘. content는 "목표: 스프라이트를 10걸음 움직이기"로 하고 position은 0으로 해.`,
    );

    expectCodleCommand(result, "scratch-activity-goal create");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "scratch-activity-goal create",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);

    const output = parseCodleOutput<{ id: string }>(interaction!.result!);
    expect(output).toHaveProperty("id");
  });
});
