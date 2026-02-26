import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client } from "../api/client.js";
import {
  buildJsonApiPayload,
  extractList,
  extractSingle,
  formatProblemSummary,
} from "../api/models.js";

const VALID_PROBLEM_TYPES = ["judge", "quiz", "sheet", "descriptive"];

export function registerProblemTools(server: McpServer): void {
  server.tool(
    "search_problems",
    `문제(Problem)를 검색합니다.

기존 문제를 찾아 자료에 재활용하거나 참고할 수 있습니다.`,
    {
      query: z
        .string()
        .optional()
        .describe("검색 키워드 (문제 제목에서 검색)"),
      problem_type: z
        .string()
        .optional()
        .describe(
          '문제 유형 필터 ("judge", "quiz", "sheet", "descriptive")'
        ),
      tag_ids: z
        .array(z.string())
        .optional()
        .describe("필터링할 태그 ID 목록"),
      is_public: z.boolean().optional().describe("공개 여부 필터"),
      page_size: z
        .number()
        .default(20)
        .describe("페이지당 결과 수 (기본 20, 최대 100)"),
      page_number: z
        .number()
        .default(1)
        .describe("페이지 번호 (1부터 시작)"),
    },
    async ({ query, problem_type, tag_ids, is_public, page_size, page_number }) => {
      const params: Record<string, string | number> = {
        "page[size]": Math.min(page_size, 100),
        "page[number]": page_number,
        "filter[is_exam]": "false",
      };
      if (query) params["filter[query]"] = query;
      if (problem_type && VALID_PROBLEM_TYPES.includes(problem_type)) {
        params["filter[problem_type]"] = problem_type;
      }
      if (is_public !== undefined) {
        params["filter[is_public]"] = String(is_public);
      }
      if (tag_ids?.length) {
        params["filter[tag_ids]"] = tag_ids.join(",");
      }

      const response = await client.listProblems(params);
      const problems = extractList(response);

      if (!problems.length) {
        return { content: [{ type: "text", text: "검색 결과가 없습니다." }] };
      }

      const lines = [`문제 검색 결과 (${problems.length}건):`];
      for (const p of problems) {
        lines.push(formatProblemSummary(p));
      }
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );

  server.tool(
    "upsert_problem",
    `문제(Problem)를 생성하거나 수정합니다.

problem_id를 지정하면 기존 문제를 수정하고, 생략하면 새 문제를 생성합니다.
user_id는 인증된 사용자로 자동 설정됩니다.

## 제약 사항
- title에 \`/\` 기호 사용 불가 (예: \`[O/X]\` → \`[OX]\`로 변경)
- blocks는 필수. content는 검색용 평문이며, 렌더링은 blocks 기준

## blocks 형식 (quiz 타입)
\`\`\`json
{
  "root": { "children": [{"type": "paragraph", "children": [{"text": "문제 본문"}]}] },
  "quiz": {
    "quizType": "ox | multipleChoice | shortAnswer",
    "answer": "O 또는 X (ox) | 0부터 시작하는 인덱스 (multipleChoice) | 정답 텍스트 (shortAnswer)",
    "choices": ["선택지1", "선택지2", ...],
    "commentary": "해설 텍스트"
  }
}
\`\`\`
- OX: \`quizType="ox"\`, \`answer="O"\` 또는 \`"X"\`
- 객관식: \`quizType="multipleChoice"\`, \`answer=0\`(첫번째 선택지), \`choices=[...]\`
- 주관식: \`quizType="shortAnswer"\`, \`answer="정답"\`

## blocks 형식 (sheet/descriptive 타입)
\`\`\`json
{
  "root": { "children": [{"type": "paragraph", "children": [{"text": "문제 본문"}]}] }
}
\`\`\`
sheet/descriptive 타입은 quiz 객체 없이 root만 포함합니다.

## 문제 타입 선택 가이드
- quiz: OX, 객관식, 주관식 — 정답이 있는 퀴즈 (blocks에 quiz 객체 필수)
- sheet: 활동지 문항 — 자유 작성형 (SheetActivity용)
- descriptive: 서술형 — 자유 작성형, 정답 일치 채점 아님 (QuizActivity에서 서술형 문항)
- judge: 코딩 문제

**주의**: 스크립트에서 [서술형]으로 표기된 문제는 quiz/shortAnswer가 아닌 descriptive를 사용하세요.`,
    {
      title: z
        .string()
        .describe("문제 제목 (필수, 최대 255자, `/` 기호 사용 불가)"),
      problem_type: z
        .string()
        .describe(
          '문제 유형 (필수, "judge"=코딩, "quiz"=퀴즈, "sheet"=시트, "descriptive"=서술형)'
        ),
      problem_id: z
        .string()
        .optional()
        .describe("수정할 문제의 ID (생략 시 새로 생성)"),
      content: z
        .string()
        .optional()
        .describe("문제 본문 텍스트 (검색용 평문)"),
      blocks: z
        .record(z.unknown())
        .optional()
        .describe("문제 본문 (Lexical 에디터 JSON 형식, 필수)"),
      is_public: z
        .boolean()
        .default(false)
        .describe("공개 여부 (기본 False)"),
      timeout: z
        .number()
        .default(1)
        .describe("실행 제한 시간(초) - judge 타입에서 사용 (기본 1)"),
      skeleton_code: z
        .string()
        .optional()
        .describe("기본 제공 코드 - judge 타입에서 사용"),
      tag_ids: z
        .array(z.string())
        .optional()
        .describe("연결할 태그 ID 목록"),
      commentary: z
        .union([z.record(z.unknown()), z.string()])
        .optional()
        .describe("문제 해설 (Lexical 에디터 JSON 형식)"),
    },
    async ({
      title,
      problem_type,
      problem_id,
      content,
      blocks,
      is_public,
      timeout,
      skeleton_code,
      tag_ids,
      commentary,
    }) => {
      if (!VALID_PROBLEM_TYPES.includes(problem_type)) {
        return {
          content: [
            {
              type: "text",
              text: `유효하지 않은 problem_type: ${problem_type}. ${VALID_PROBLEM_TYPES.join(", ")} 중 하나를 사용하세요.`,
            },
          ],
        };
      }
      if (title.includes("/")) {
        return {
          content: [
            {
              type: "text",
              text: `제목에 \`/\` 기호를 사용할 수 없습니다. 현재 제목: ${title}`,
            },
          ],
        };
      }
      if (!blocks && !problem_id) {
        return {
          content: [
            {
              type: "text",
              text: "blocks는 필수입니다. Lexical 에디터 JSON 형식으로 문제 본문을 제공하세요.",
            },
          ],
        };
      }

      const attrs: Record<string, unknown> = { title };
      if (!problem_id) {
        attrs.problem_type = problem_type;
      }
      if (content !== undefined) attrs.content = content;
      if (blocks !== undefined) attrs.blocks = blocks;
      attrs.is_public = is_public;
      attrs.timeout = timeout;
      if (skeleton_code !== undefined) attrs.skeleton_code = skeleton_code;
      if (tag_ids !== undefined) attrs.tag_ids = tag_ids;
      if (commentary !== undefined) {
        if (typeof commentary === "string") {
          try {
            attrs.commentary = JSON.parse(commentary);
          } catch {
            attrs.commentary = commentary;
          }
        } else {
          attrs.commentary = commentary;
        }
      }

      const payload = buildJsonApiPayload("problems", attrs, problem_id);

      if (problem_id) {
        const response = await client.updateProblem(
          problem_id,
          payload as Record<string, unknown>
        );
        const problem = extractSingle(response);
        return {
          content: [
            {
              type: "text",
              text: `문제 수정 완료: [${problem.id}] ${problem.title}`,
            },
          ],
        };
      } else {
        const response = await client.createProblem(
          payload as Record<string, unknown>
        );
        const problem = extractSingle(response);
        return {
          content: [
            {
              type: "text",
              text: `문제 생성 완료: [${problem.id}] ${problem.title} (type: ${problem_type})`,
            },
          ],
        };
      }
    }
  );
}
