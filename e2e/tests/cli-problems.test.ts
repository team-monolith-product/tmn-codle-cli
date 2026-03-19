import { describe, expect, test } from "../fixtures/cli.js";
import { createMaterial } from "../lib/factory.js";
import { findLastCodleCommand } from "../lib/ndjson.js";

describe("cli: problem create", () => {
  test("퀴즈 문제 생성 커맨드 실행", async ({ cli }) => {
    const result = await cli.run(
      `"E2E CLI 퀴즈" 제목으로 O/X 퀴즈 문제를 만들어줘. O가 정답이야.`,
    );

    const cmd = findLastCodleCommand(result.toolInteractions);
    expect(cmd).toBeDefined();
    expect(cmd).toMatch(/problem\s+create/);
    expect(cmd).toMatch(/quiz/);
  });

  test("서술형 문제 생성 커맨드 실행", async ({ cli }) => {
    const result = await cli.run(
      `"E2E CLI 서술형" 제목으로 서술형 문제를 만들어줘. 질문은 "차이를 설명하세요."야.`,
    );

    const cmd = findLastCodleCommand(result.toolInteractions);
    expect(cmd).toBeDefined();
    expect(cmd).toMatch(/problem\s+create/);
    expect(cmd).toMatch(/descriptive/);
  });
});

describe("cli: problem collection sync", () => {
  test("문제 연결 커맨드에 활동 ID 포함", async ({ cli, factory }) => {
    const material = await createMaterial(factory);

    const result = await cli.run(
      `자료 "${material.id}"에 퀴즈 활동을 만들고, 그 활동에 문제를 연결해줘. ` +
        `문제 제목은 "CLI OX"이고 O가 정답인 O/X야.`,
    );

    const cmd = findLastCodleCommand(result.toolInteractions);
    expect(cmd).toBeDefined();
    expect(cmd).toMatch(/problem\s+collection\s+sync/);
  });
});
