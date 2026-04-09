// AIDEV-NOTE: 왜 이 후처리가 필요한가?
//
// CDS 렌더가 기대하는 구조:  root > image  (image가 root 직속)
// markdown 변환이 만드는 구조: root > paragraph > image  (image가 paragraph 안)
//
// 원인: CDS의 IMAGE transformer(TextMatchTransformer)가 inline 치환을 하기 때문.
// CDS 본가도 동일한 문제를 가지고 있으나, 에디터 UI로만 이미지를 삽입하므로 미발견.
// CLI는 markdown 변환 경로만 사용하므로 이 후처리로 image를 root level로 꺼낸다.
// CLI의 IMAGE transformer는 CDS 본가의 구현을 그대로 포팅한 것이며,
// 이 호환성을 유지하기 위해 transformer 수정 대신 후처리를 택함.

import type { SerializedEditorState, SerializedLexicalNode } from "lexical";

interface ParagraphLikeNode extends SerializedLexicalNode {
  type: string;
  children: SerializedLexicalNode[];
}

function isParagraph(node: SerializedLexicalNode): node is ParagraphLikeNode {
  return (
    node.type === "paragraph" &&
    Array.isArray((node as ParagraphLikeNode).children)
  );
}

function isImage(node: SerializedLexicalNode): boolean {
  return node.type === "image";
}

/**
 * paragraph 안에 이미지가 섞여 있으면, 이미지를 root 레벨로 승격시키고
 * 양옆 inline 컨텐츠는 별도 paragraph로 분할한다.
 *
 * 예: paragraph[text "hello ", image, text " world"]
 *  → [paragraph[text "hello "], image, paragraph[text " world"]]
 *
 * paragraph가 image만 가지고 있으면 빈 paragraph를 남기지 않고 image만 promote.
 */
function splitParagraphAtImages(
  paragraph: ParagraphLikeNode,
): SerializedLexicalNode[] {
  const result: SerializedLexicalNode[] = [];
  let bufferedInlines: SerializedLexicalNode[] = [];

  const flushBuffer = () => {
    if (bufferedInlines.length === 0) return;
    result.push({
      ...paragraph,
      children: bufferedInlines,
    } as ParagraphLikeNode);
    bufferedInlines = [];
  };

  for (const child of paragraph.children) {
    if (isImage(child)) {
      flushBuffer();
      result.push(child);
    } else {
      bufferedInlines.push(child);
    }
  }
  flushBuffer();

  return result;
}

export function promoteBlockImages(
  state: SerializedEditorState,
): SerializedEditorState {
  const root = state.root;
  let mutated = false;
  const newChildren: SerializedLexicalNode[] = [];

  for (const child of root.children) {
    if (isParagraph(child) && child.children.some(isImage)) {
      mutated = true;
      newChildren.push(...splitParagraphAtImages(child));
    } else {
      newChildren.push(child);
    }
  }

  if (!mutated) return state;
  return { root: { ...root, children: newChildren } };
}
