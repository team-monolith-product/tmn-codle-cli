import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, test } from "../../fixtures/claude.js";
import {
  expectCodleCommand,
  findCodleInteraction,
  parseCodleOutput,
} from "../../lib/ndjson.js";

// AIDEV-NOTE: CLI의 resolveLocalImages는 file:// URL만 허용한다.
// 테스트 파일 위치 기준으로 fixture의 file:// URL을 미리 계산해 프롬프트에 전달한다.
const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_IMAGE_URL = pathToFileURL(
  resolve(__dirname, "../../fixtures/upload-diagram.png"),
).href;

const RAILS_REDIRECT_URL_RE =
  /https?:\/\/[^\s"'()]+\/rails\/active_storage\/blobs\/redirect\/[^\s"'()]+/;

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

    const output = parseCodleOutput<{ id: string }>(interaction!.result!);
    expect(output).toHaveProperty("id");
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

    const output = parseCodleOutput<{ id: string }>(interaction!.result!);
    expect(output).toHaveProperty("id");
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

    const output = parseCodleOutput<{ id: string }>(interaction!.result!);
    expect(output).toHaveProperty("id");
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

    const output = parseCodleOutput<{ id: string }>(interaction!.result!);
    expect(output).toHaveProperty("id");
  });

  test("서술형 문제 생성 (채점기준 없이)", async ({ claude }) => {
    const result = await claude.run(
      `"E2E 서술형 기본" 제목으로 서술형 문제를 만들어줘.\n` +
        `질문: "인공지능의 활용 사례를 서술하세요."\n` +
        `채점기준은 넣지 마.`,
    );

    expectCodleCommand(result, "problem create");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "problem create",
    );
    expect(interaction!.result!.isError).toBe(false);

    const command = interaction!.call.input.command as string;
    expect(command).toContain("descriptive");
    expect(command).not.toMatch(/--criteria/);

    const output = parseCodleOutput<{ id: string; warnings?: string[] }>(
      interaction!.result!,
    );
    expect(output).toHaveProperty("id");
    expect(output.warnings).toBeUndefined();
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

    const output = parseCodleOutput<{ id: string }>(interaction!.result!);
    expect(output).toHaveProperty("id");
  });
});

describe("problem create with local image", () => {
  // AIDEV-NOTE: 약한 모델에서 "활동지(sheet)"는 sheet activity와 problem type sheet 사이의 모호성을
  // 일으켜 명령 호출에 실패하는 경우가 있다. 1:1로 매핑되는 "서술형" 용어를 사용한다.
  test("본문의 로컬 이미지 파일이 업로드 URL로 치환", async ({ claude }) => {
    const title = `E2E Image ${Date.now()}`;
    const result = await claude.run(
      `"${title}" 제목으로 서술형 문제를 만들어줘. ` +
        `본문에 "${FIXTURE_IMAGE_URL}" 파일을 이미지로 첨부해서, ` +
        `"이 사진을 보고 떠오르는 점을 자유롭게 적어보세요" 라는 질문으로 만들어줘.`,
    );

    expectCodleCommand(result, "problem create");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "problem create",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);

    const command = interaction!.call.input.command as string;
    expect(command).toContain("upload-diagram.png");

    const output = parseCodleOutput<{ id: string }>(interaction!.result!);
    expect(output).toHaveProperty("id");
    const serialized = JSON.stringify(output);
    expect(serialized).toMatch(RAILS_REDIRECT_URL_RE);
    expect(serialized).not.toContain(FIXTURE_IMAGE_URL);
  });
});

describe("problem create with image size", () => {
  test("=WIDTHxHEIGHT 문법으로 문제 본문 이미지에 크기 반영", async ({
    claude,
  }) => {
    const title = `E2E ImgSize Problem ${Date.now()}`;
    const result = await claude.run(
      `"${title}" 제목으로 서술형 문제를 만들어줘. ` +
        `본문에 "${FIXTURE_IMAGE_URL}" 파일을 이미지로 포함하되, ` +
        `이미지 크기를 =600x400 으로 지정해줘. ` +
        `마크다운 이미지 문법 끝에 " =600x400"을 붙이면 돼. ` +
        `예: ![alt](url =600x400). ` +
        `질문은 "이미지를 보고 설명하세요" 로 해줘.`,
    );

    expectCodleCommand(result, "problem create");

    const interaction = findCodleInteraction(
      result.toolInteractions,
      "problem create",
    );
    expect(interaction?.result).toBeDefined();
    expect(interaction!.result!.isError).toBe(false);

    const command = interaction!.call.input.command as string;
    expect(command).toMatch(/=600x400/);

    const output = parseCodleOutput<{ id: string }>(interaction!.result!);
    expect(output).toHaveProperty("id");
    const serialized = JSON.stringify(output);
    expect(serialized).toContain('"width":600');
    expect(serialized).toContain('"height":400');
  });
});
