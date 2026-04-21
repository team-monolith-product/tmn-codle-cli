import { describe, expect, test } from "../../fixtures/claude.js";
import { createActivity, createMaterial } from "../../lib/factory.js";
import {
  expectCodleCommand,
  findCodleInteraction,
  parseCodleOutput,
} from "../../lib/ndjson.js";

describe("activitiable update (VideoActivity — screen_narration_script)", () => {
  test("영상 활동에 나레이션 스크립트 설정", async ({ claude, factory }) => {
    const material = await createMaterial(factory);
    const videoActivitiable = await factory.create("video_activity", {
      url: "https://example.com/video",
    });
    const activity = await createActivity(factory, material.id, {
      name: "E2E Video Narration",
      activitiableType: "VideoActivity",
      activitiableId: videoActivitiable.id,
    });

    const result = await claude.run(
      `활동 ID "${activity.id}"의 영상 활동에 화면 해설 스크립트를 설정해줘. 내용은 "# 첫 번째 장면\n이 장면에서는 기본 개념을 설명합니다."로 해.`,
    );

    expectCodleCommand(result, "activitiable update");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "activitiable update",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);

    const command = interaction!.call.input.command as string;
    expect(command).toContain("--screen-narration-script");

    const output = parseCodleOutput<{ id: string }>(interaction!.result!);
    expect(output).toHaveProperty("id");
  });
});

describe("activitiable update (CodapActivity — goals)", () => {
  test("CODAP 활동에 학습 목표 설정", async ({ claude, factory }) => {
    const material = await createMaterial(factory);
    const codapActivitiable = await factory.create("codap_activity");
    const activity = await createActivity(factory, material.id, {
      name: "E2E Codap Goals",
      activitiableType: "CodapActivity",
      activitiableId: codapActivitiable.id,
    });

    const result = await claude.run(
      `활동 ID "${activity.id}"의 CODAP 활동에 학습 목표를 설정해줘. 목표 1: "데이터를 시각화할 수 있다", 목표 2: "그래프를 해석할 수 있다"`,
    );

    expectCodleCommand(result, "activitiable update");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "activitiable update",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);

    const command = interaction!.call.input.command as string;
    expect(command).toContain("--goals");

    const output = parseCodleOutput<{ id: string }>(interaction!.result!);
    expect(output).toHaveProperty("id");
  });
});

describe("activitiable update (QuizActivity)", () => {
  test("퀴즈 활동을 평가용으로 변경", async ({ claude, factory }) => {
    const material = await createMaterial(factory);
    const quizActivitiable = await factory.create("quiz_activity");
    const activity = await createActivity(factory, material.id, {
      name: "E2E Quiz for Exam",
      activitiableType: "QuizActivity",
      activitiableId: quizActivitiable.id,
    });

    const result = await claude.run(
      `활동 ID "${activity.id}"의 퀴즈를 평가용(is_exam)으로 설정해줘.`,
    );

    expectCodleCommand(result, "activitiable update");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "activitiable update",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);

    const command = interaction!.call.input.command as string;
    expect(command).toContain("--is-exam");

    const output = parseCodleOutput<{ id: string }>(interaction!.result!);
    expect(output).toHaveProperty("id");
  });

  test("퀴즈 활동을 비평가용으로 변경", async ({ claude, factory }) => {
    const material = await createMaterial(factory);
    const quizActivitiable = await factory.create("quiz_activity", {
      is_exam: true,
    });
    const activity = await createActivity(factory, material.id, {
      name: "E2E Quiz Non-Exam",
      activitiableType: "QuizActivity",
      activitiableId: quizActivitiable.id,
    });

    const result = await claude.run(
      `활동 ID "${activity.id}"의 퀴즈를 비평가용으로 설정해줘. --no-is-exam 플래그를 사용해.`,
    );

    expectCodleCommand(result, "activitiable update");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "activitiable update",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);

    const command = interaction!.call.input.command as string;
    expect(command).toContain("--no-is-exam");

    const output = parseCodleOutput<{ id: string }>(interaction!.result!);
    expect(output).toHaveProperty("id");
  });
});

describe("activitiable update", () => {
  test("보드 안내문 설정", async ({ claude, factory }) => {
    const material = await createMaterial(factory);

    const result = await claude.run(
      `자료 ID "${material.id}"에 보드 활동 "E2E Board"를 만들고, ` +
        `안내문을 "여러분의 경험을 적어 보세요."로 설정해줘.`,
    );

    expectCodleCommand(result, "activitiable update");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "activitiable update",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);

    const output = parseCodleOutput<unknown>(interaction!.result!);
    expect(output).toBeDefined();
  });

  test("EmbeddedActivity URL 및 학습목표 설정", async ({ claude, factory }) => {
    const material = await createMaterial(factory);

    const result = await claude.run(
      `자료 ID "${material.id}"에 외부URL 활동 "E2E Embed"를 만들고, ` +
        `URL을 "https://example.com/embed"로, ` +
        `학습목표를 "목표 1: 개념 이해", "목표 2: 실습"으로 설정해줘.`,
    );

    // url may be passed via activity create or activitiable update
    const allInteractions = [
      ...result.toolInteractions.filter(
        (i) =>
          i.call.name === "Bash" &&
          ((i.call.input.command as string) ?? "").includes("codle"),
      ),
    ];

    const urlPassed = allInteractions.some((i) =>
      (i.call.input.command as string).includes("https://example.com/embed"),
    );
    expect(urlPassed).toBe(true);

    // goals should be passed via activitiable update
    const activitiableInteraction = findCodleInteraction(
      result.toolInteractions,
      "activitiable update",
    );
    expect(activitiableInteraction).toBeDefined();
    const command = activitiableInteraction!.call.input.command as string;
    expect(command).toMatch(/--goals/);

    expect(activitiableInteraction!.result).toBeDefined();
    expect(activitiableInteraction!.result!.isError).toBe(false);

    const output = parseCodleOutput<unknown>(activitiableInteraction!.result!);
    expect(output).toBeDefined();
  });

  test("활동지 설명 설정", async ({ claude, factory }) => {
    const material = await createMaterial(factory);

    const result = await claude.run(
      `자료 ID "${material.id}"에 활동지 활동 "E2E Sheet Desc"를 만들고, ` +
        `활동지 설명을 "다음 AI 서비스를 분류하세요."로 설정해줘.`,
    );

    expectCodleCommand(result, "activitiable update");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "activitiable update",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);

    const output = parseCodleOutput<unknown>(interaction!.result!);
    expect(output).toBeDefined();
  });
});
