import { describe, it, expect } from "vitest";
import {
  buildSelectBlock,
  buildInputBlock,
} from "../src/lexical/buildQuizBlocks.js";

/** root.children 추출 헬퍼 */
function getChildren(
  result: ReturnType<typeof buildSelectBlock>,
): Array<Record<string, unknown>> {
  return (result.root as Record<string, unknown>).children as Array<
    Record<string, unknown>
  >;
}

/** paragraph → text 노드의 텍스트 추출 */
function getParagraphText(node: Record<string, unknown>): string {
  const children = node.children as Array<Record<string, unknown>>;
  return children.length ? String(children[0].text) : "";
}

describe("buildSelectBlock", () => {
  it("O/X choices with question text", () => {
    const result = buildSelectBlock(
      [
        { text: "O", isAnswer: true },
        { text: "X", isAnswer: false },
      ],
      "다음 중 맞는 것은?",
    );

    expect(result.root.type).toBe("root");
    const children = getChildren(result);
    expect(children).toHaveLength(3);

    // paragraph (질문 텍스트)
    expect(children[0].type).toBe("paragraph");
    expect(getParagraphText(children[0])).toBe("다음 중 맞는 것은?");

    // paragraph (빈 줄)
    expect(children[1].type).toBe("paragraph");
    expect(children[1].children).toEqual([]);

    // problem-select
    const node = children[2];
    expect(node.type).toBe("problem-select");
    expect(node.version).toBe(1);
    expect(node.selected).toEqual([]);
    expect(node.hasMultipleSolutions).toBe(false);

    const selections = node.selections as Array<Record<string, unknown>>;
    expect(selections).toHaveLength(2);
    expect(selections[0]).toEqual({
      isAnswer: true,
      show: { text: "O", image: null },
      value: "0",
    });
    expect(selections[1]).toEqual({
      isAnswer: false,
      show: { text: "X", image: null },
      value: "1",
    });
  });

  it("without questionText produces empty paragraph", () => {
    const result = buildSelectBlock([
      { text: "A", isAnswer: true },
      { text: "B", isAnswer: false },
    ]);

    const children = getChildren(result);
    expect(children).toHaveLength(3);
    expect(children[0].type).toBe("paragraph");
    expect(getParagraphText(children[0])).toBe("");
    expect(children[2].type).toBe("problem-select");
  });

  it("multiple choice with 4 options", () => {
    const result = buildSelectBlock([
      { text: "사과", isAnswer: false },
      { text: "바나나", isAnswer: true },
      { text: "포도", isAnswer: false },
      { text: "수박", isAnswer: false },
    ]);

    const children = getChildren(result);
    const selections = children[2].selections as Array<Record<string, unknown>>;
    expect(selections).toHaveLength(4);
    expect(selections[1].isAnswer).toBe(true);
    expect(selections[0].isAnswer).toBe(false);
  });

  it("choices with imageUrl produce show.image object", () => {
    const result = buildSelectBlock([
      {
        text: "사과",
        isAnswer: true,
        imageUrl: "https://example.com/apple.png",
        imageAlt: "사과 이미지",
      },
      {
        text: "바나나",
        isAnswer: false,
        imageUrl: "https://example.com/banana.png",
      },
      { text: "포도", isAnswer: false },
    ]);

    const children = getChildren(result);
    const selections = children[2].selections as Array<Record<string, unknown>>;
    expect(selections).toHaveLength(3);
    expect(selections[0]).toEqual({
      isAnswer: true,
      show: {
        text: "사과",
        image: {
          src: "https://example.com/apple.png",
          altText: "사과 이미지",
        },
      },
      value: "0",
    });
    expect(selections[1]).toEqual({
      isAnswer: false,
      show: {
        text: "바나나",
        image: { src: "https://example.com/banana.png", altText: "" },
      },
      value: "1",
    });
    expect(selections[2]).toEqual({
      isAnswer: false,
      show: { text: "포도", image: null },
      value: "2",
    });
  });

  it("root structure matches Lexical format", () => {
    const result = buildSelectBlock([
      { text: "A", isAnswer: true },
      { text: "B", isAnswer: false },
    ]);

    const root = result.root as Record<string, unknown>;
    expect(root.format).toBe("");
    expect(root.indent).toBe(0);
    expect(root.version).toBe(1);
    expect(root.direction).toBe("ltr");
  });

  it("paragraph nodes match Lexical format", () => {
    const result = buildSelectBlock([{ text: "A", isAnswer: true }], "질문");

    const children = getChildren(result);
    const questionParagraph = children[0];
    expect(questionParagraph.format).toBe("");
    expect(questionParagraph.indent).toBe(0);
    expect(questionParagraph.version).toBe(1);
    expect(questionParagraph.direction).toBe("ltr");

    const textNode = (
      questionParagraph.children as Array<Record<string, unknown>>
    )[0];
    expect(textNode.mode).toBe("normal");
    expect(textNode.style).toBe("");
    expect(textNode.detail).toBe(0);
    expect(textNode.format).toBe(0);
    expect(textNode.version).toBe(1);
  });
});

describe("buildInputBlock", () => {
  it("single solution with question text", () => {
    const result = buildInputBlock(["42"], undefined, "정답은?");

    const children = getChildren(result);
    expect(children).toHaveLength(3);

    expect(children[0].type).toBe("paragraph");
    expect(getParagraphText(children[0])).toBe("정답은?");
    expect(children[1].type).toBe("paragraph");
    expect(children[1].children).toEqual([]);

    const node = children[2];
    expect(node.type).toBe("problem-input");
    expect(node.solutions).toEqual(["42"]);
  });

  it("without questionText produces empty paragraph", () => {
    const result = buildInputBlock(["42"]);

    const children = getChildren(result);
    expect(children).toHaveLength(3);
    expect(children[0].type).toBe("paragraph");
    expect(getParagraphText(children[0])).toBe("");
  });

  it("multiple solutions", () => {
    const result = buildInputBlock(["서울", "Seoul"]);

    const children = getChildren(result);
    const node = children[2];
    expect(node.solutions).toEqual(["서울", "Seoul"]);
  });

  it("with caseSensitive option", () => {
    const result = buildInputBlock(["Hello"], { caseSensitive: true });

    const children = getChildren(result);
    const node = children[2];
    expect(node.caseSensitive).toBe(true);
  });

  it("with placeholder option", () => {
    const result = buildInputBlock(["정답"], {
      placeholder: "답을 입력하세요",
    });

    const children = getChildren(result);
    const node = children[2];
    expect(node.placeholder).toBe("답을 입력하세요");
  });

  it("no options omits optional fields", () => {
    const result = buildInputBlock(["test"]);

    const children = getChildren(result);
    const node = children[2];
    expect(node.caseSensitive).toBeUndefined();
    expect(node.placeholder).toBeUndefined();
  });
});
