import type { SerializedEditorState } from "lexical";

interface SelectChoice {
  text: string;
  isAnswer: boolean;
  imageUrl?: string;
  imageAlt?: string;
}

interface InputOptions {
  caseSensitive?: boolean;
  placeholder?: string;
}

function wrapRoot(children: Record<string, unknown>[]): SerializedEditorState {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children,
    },
  } as unknown as SerializedEditorState;
}

// AIDEV-NOTE: problem-select/problem-input are CDS-specific Lexical nodes
// that cannot be produced by standard markdown→Lexical conversion.
// The JSON structure is derived from Rails factory specs and CDS node implementations.

// AIDEV-NOTE: Lexical 에디터 편집 모드에서 역직렬화하려면 root.children에
// paragraph(질문텍스트) + paragraph(빈줄) + quiz노드 순서가 필요하다.
// Rails QuizActivityService::Lexical.lexical_block 구조를 그대로 따른다.

function buildQuestionParagraph(text: string): Record<string, unknown> {
  return {
    type: "paragraph",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    children: text
      ? [
          {
            type: "text",
            text,
            mode: "normal",
            style: "",
            detail: 0,
            format: 0,
            version: 1,
          },
        ]
      : [],
  };
}

function buildBlankParagraph(): Record<string, unknown> {
  return {
    type: "paragraph",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    children: [],
  };
}

export function buildSelectBlock(
  choices: SelectChoice[],
  questionText?: string,
): SerializedEditorState {
  const hasMultipleSolutions = choices.filter((c) => c.isAnswer).length > 1;
  const selections = choices.map((c, i) => ({
    isAnswer: c.isAnswer,
    show: {
      text: c.text,
      image: c.imageUrl ? { src: c.imageUrl, altText: c.imageAlt ?? "" } : null,
    },
    value: String(i),
  }));
  return wrapRoot([
    buildQuestionParagraph(questionText ?? ""),
    buildBlankParagraph(),
    {
      type: "problem-select",
      version: 1,
      selected: [],
      selections,
      hasMultipleSolutions,
    },
  ]);
}

export function buildInputBlock(
  solutions: string[],
  options?: InputOptions,
  questionText?: string,
): SerializedEditorState {
  const node: Record<string, unknown> = {
    type: "problem-input",
    solutions,
  };
  if (options?.caseSensitive !== undefined) {
    node.caseSensitive = options.caseSensitive;
  }
  if (options?.placeholder !== undefined) {
    node.placeholder = options.placeholder;
  }
  return wrapRoot([
    buildQuestionParagraph(questionText ?? ""),
    buildBlankParagraph(),
    node,
  ]);
}
