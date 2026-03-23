import { describe, expect, test } from "../fixtures/claude.js";
import { createActivity, createMaterial } from "../lib/factory.js";
import { expectCodleCommand, findCodleInteraction } from "../lib/ndjson.js";

// ===== problem create =====

describe("problem create", () => {
  test("O/X 퀴즈 문제 생성 (이미지 선택지)", async ({ claude }) => {
    const result = await claude.run(
      `"E2E OX" 제목으로 퀴즈 문제를 만들어줘. O가 정답이고 X가 오답인 O/X 문제야.`,
    );

    expectCodleCommand(result, "problem create");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "problem create",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);

    const command = interaction!.call.input.command as string;
    expect(command).toContain("quiz");
    expect(command).toMatch(/--choices/);
  });

  test("객관식 퀴즈 문제 생성 (4지선다)", async ({ claude }) => {
    const result = await claude.run(
      `"E2E 객관식" 제목으로 퀴즈 문제를 만들어줘. ` +
        `질문은 "스팸 메일 필터가 사용하는 데이터는?"이고, ` +
        `선택지는 이미지, 텍스트(정답), 소리, 수치야.`,
    );

    expectCodleCommand(result, "problem create");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "problem create",
    );
    expect(interaction!.result!.isError).toBe(false);

    const command = interaction!.call.input.command as string;
    expect(command).toContain("quiz");
    expect(command).toMatch(/--choices/);
  });

  test("주관식 퀴즈 문제 생성", async ({ claude }) => {
    const result = await claude.run(
      `"E2E 주관식" 제목으로 주관식 퀴즈 문제를 만들어줘. ` +
        `질문은 "AI가 스스로 패턴을 찾는 학습 방식은?"이고, 정답은 "비지도학습"이야.`,
    );

    expectCodleCommand(result, "problem create");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "problem create",
    );
    expect(interaction!.result!.isError).toBe(false);

    const command = interaction!.call.input.command as string;
    expect(command).toContain("비지도학습");
  });

  test("서술형 문제 생성 (모범답안 + 채점기준)", async ({ claude }) => {
    const result = await claude.run(
      `"E2E 서술형" 제목으로 서술형 문제를 만들어줘.\n` +
        `질문: "지도학습과 비지도학습의 차이를 설명하세요."\n` +
        `모범답안: "지도학습은 정답이 있는 데이터로 학습하고, 비지도학습은 정답 없이 패턴을 찾는다."\n` +
        `평가 요소: "차이점 설명, 예시"\n` +
        `채점기준 상(1.0): "차이를 정확히 설명하고 예시를 들었다."\n` +
        `채점기준 중(0.7): "차이를 설명했으나 예시가 부족하다."\n` +
        `채점기준 하(0.3): "설명이 부족하다."`,
    );

    expectCodleCommand(result, "problem create");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "problem create",
    );
    expect(interaction!.result!.isError).toBe(false);

    const command = interaction!.call.input.command as string;
    expect(command).toContain("descriptive");
    expect(command).toMatch(/--sample-answer/);
  });

  test("활동지(sheet) 문제 생성", async ({ claude }) => {
    const result = await claude.run(
      `"E2E 활동지" 제목으로 활동지(sheet) 문제를 만들어줘. 내용은 "다음을 설명하시오"야.`,
    );

    expectCodleCommand(result, "problem create");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "problem create",
    );
    expect(interaction!.result!.isError).toBe(false);

    const command = interaction!.call.input.command as string;
    expect(command).toContain("sheet");
  });
});

// ===== problem-collection sync =====
// AIDEV-NOTE: factory로 활동과 문제를 미리 생성하고, AI에게는 sync만 요청한다.
// multi-step(활동 생성 + 문제 생성 + sync)을 하나의 프롬프트에 넣으면 haiku가 실패한다.

describe("problem-collection sync", () => {
  test("퀴즈 활동에 문제 연결", async ({ claude, factory }) => {
    const material = await createMaterial(factory);
    const quizActivitiable = await factory.create<{ id: string }>(
      "quiz_activity",
    );
    const activity = await createActivity(factory, material.id, {
      name: "E2E Quiz",
      activitiableType: "QuizActivity",
      activitiableId: quizActivitiable.id,
    });
    await factory.create("problem_collection", { activityId: activity.id });
    const problem = await factory.create<{ id: string }>("problem", {
      title: "E2E OX",
      problemType: "quiz",
    });

    const result = await claude.run(
      `활동 ID "${activity.id}"에 문제 ID "${problem.id}"를 연결해줘.`,
    );

    expectCodleCommand(result, "problem-collection sync");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "problem-collection sync",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);
  });

  test("여러 문제를 퀴즈에 순서대로 연결", async ({ claude, factory }) => {
    const material = await createMaterial(factory);
    const quizActivitiable = await factory.create<{ id: string }>(
      "quiz_activity",
    );
    const activity = await createActivity(factory, material.id, {
      name: "E2E Multi",
      activitiableType: "QuizActivity",
      activitiableId: quizActivitiable.id,
    });
    await factory.create("problem_collection", { activityId: activity.id });
    const p1 = await factory.create<{ id: string }>("problem", {
      title: "E2E Q1",
      problemType: "quiz",
    });
    const p2 = await factory.create<{ id: string }>("problem", {
      title: "E2E Q2",
      problemType: "quiz",
    });

    const result = await claude.run(
      `활동 ID "${activity.id}"에 문제 "${p1.id}"와 "${p2.id}"를 순서대로 연결해줘.`,
    );

    expectCodleCommand(result, "problem-collection sync");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "problem-collection sync",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);
  });

  test("활동지에 문제 연결", async ({ claude, factory }) => {
    const material = await createMaterial(factory);
    const sheetActivitiable = await factory.create<{ id: string }>(
      "sheet_activity",
    );
    const activity = await createActivity(factory, material.id, {
      name: "E2E Sheet",
      activitiableType: "SheetActivity",
      activitiableId: sheetActivitiable.id,
    });
    await factory.create("problem_collection", { activityId: activity.id });
    const problem = await factory.create<{ id: string }>("problem", {
      title: "E2E Sheet Problem",
      problemType: "sheet",
    });

    const result = await claude.run(
      `활동 ID "${activity.id}"에 문제 ID "${problem.id}"를 연결해줘.`,
    );

    expectCodleCommand(result, "problem-collection sync");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "problem-collection sync",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);
  });
});

// ===== activitiable update =====

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
  });
});
