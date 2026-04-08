import { describe, it, expect } from "vitest";
import type { SerializedEditorState } from "lexical";
import { promoteBlockImages } from "../src/lexical/promoteBlockImages.js";

function makeRoot(children: unknown[]): SerializedEditorState {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: null,
      children: children as never,
    },
  } as unknown as SerializedEditorState;
}

function paragraph(children: unknown[]): Record<string, unknown> {
  return {
    type: "paragraph",
    format: "",
    indent: 0,
    version: 1,
    direction: null,
    children,
  };
}

function text(value: string): Record<string, unknown> {
  return {
    type: "text",
    text: value,
    format: 0,
    detail: 0,
    mode: "normal",
    style: "",
    version: 1,
  };
}

function image(src: string): Record<string, unknown> {
  return {
    type: "image",
    src,
    altText: "alt",
    width: 0,
    height: 0,
    maxWidth: 800,
    showCaption: false,
    caption: { editorState: { root: { type: "root", children: [] } } },
    version: 1,
  };
}

describe("promoteBlockImages", () => {
  it("promotes a paragraph that contains only an image into a root-level image", () => {
    const state = makeRoot([paragraph([image("a.png")])]);
    const result = promoteBlockImages(state);
    const children = result.root.children as Array<Record<string, unknown>>;
    expect(children).toHaveLength(1);
    expect(children[0].type).toBe("image");
    expect(children[0].src).toBe("a.png");
  });

  it("splits paragraph[text, image, text] into three blocks", () => {
    const state = makeRoot([
      paragraph([text("hello "), image("a.png"), text(" world")]),
    ]);
    const result = promoteBlockImages(state);
    const children = result.root.children as Array<Record<string, unknown>>;
    expect(children).toHaveLength(3);
    expect(children[0].type).toBe("paragraph");
    expect(
      (children[0].children as Array<Record<string, unknown>>)[0].text,
    ).toBe("hello ");
    expect(children[1].type).toBe("image");
    expect(children[2].type).toBe("paragraph");
    expect(
      (children[2].children as Array<Record<string, unknown>>)[0].text,
    ).toBe(" world");
  });

  it("handles multiple images in one paragraph", () => {
    const state = makeRoot([
      paragraph([
        text("a "),
        image("1.png"),
        text(" b "),
        image("2.png"),
        text(" c"),
      ]),
    ]);
    const result = promoteBlockImages(state);
    const children = result.root.children as Array<Record<string, unknown>>;
    expect(children.map((c) => c.type)).toEqual([
      "paragraph",
      "image",
      "paragraph",
      "image",
      "paragraph",
    ]);
  });

  it("preserves order across multiple paragraphs and images", () => {
    const state = makeRoot([
      paragraph([text("first")]),
      paragraph([image("a.png")]),
      paragraph([text("between"), image("b.png")]),
      paragraph([text("last")]),
    ]);
    const result = promoteBlockImages(state);
    const types = (result.root.children as Array<Record<string, unknown>>).map(
      (c) => c.type,
    );
    expect(types).toEqual([
      "paragraph",
      "image",
      "paragraph",
      "image",
      "paragraph",
    ]);
  });

  it("returns the same state object when there are no images (no mutation)", () => {
    const state = makeRoot([paragraph([text("plain")])]);
    const result = promoteBlockImages(state);
    expect(result).toBe(state);
  });

  it("does not touch image nodes that are already at root level", () => {
    const state = makeRoot([image("already-at-root.png")]);
    const result = promoteBlockImages(state);
    expect(result).toBe(state);
    const children = result.root.children as Array<Record<string, unknown>>;
    expect(children[0].type).toBe("image");
  });
});
