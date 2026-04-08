// AIDEV-NOTE: @lexical/markdown의 IMAGE transformer는 textNode.replace(imageNode)로
// image를 paragraph 내부에 둔다. 그러나 CDS의 ImageNode는 isInline()=false (block decorator)
// 이고 표준 JSON 구조 (jce-codle-cds/src/stories/assets/image-node.json)는 image가
// root.children 직속이어야 한다. CDS UI는 INSERT_IMAGE_COMMAND에서
// $insertNodeToNearestRoot로 root level에 삽입하지만, markdown shortcut path는 동일한
// 버그를 가진다 (CDS production에서는 markdown import를 안 써서 미발견).
// 우리 CLI는 markdown 변환만 쓰므로 이 후처리로 image를 root level로 승격시킨다.

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
