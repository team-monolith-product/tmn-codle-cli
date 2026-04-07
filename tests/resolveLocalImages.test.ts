import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CodleClient } from "../src/api/client.js";
import { resolveLocalImages } from "../src/lexical/resolveLocalImages.js";

function makeMockClient(): CodleClient {
  return {
    getBaseUrl: vi.fn(() => "https://class.codle.io"),
    createDirectUpload: vi.fn(async (blob: { filename: string }) => ({
      signed_id: `sid-${blob.filename}`,
      filename: blob.filename,
      direct_upload: {
        url: `https://s3/upload/${blob.filename}`,
        headers: {},
      },
    })),
  } as unknown as CodleClient;
}

function makeFile(dir: string, name: string, content = "x"): string {
  const full = join(dir, name);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, Buffer.from(content));
  return full;
}

describe("resolveLocalImages", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "resolve-local-images-"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => "",
      }),
    );
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  it("leaves markdown unchanged when there are no images", async () => {
    const md = "# Hello\n\nplain text";
    const client = makeMockClient();
    const result = await resolveLocalImages(md, client, tmpDir);
    expect(result).toBe(md);
    expect(client.createDirectUpload).not.toHaveBeenCalled();
  });

  it("leaves remote URLs untouched (http/https/data/file/mailto schemes)", async () => {
    const md = [
      "![a](https://example.com/a.png)",
      "![b](http://example.com/b.png)",
      "![c](data:image/png;base64,AAA)",
      "![d](file:///etc/passwd)",
      "![e](mailto:foo@bar)",
    ].join("\n");
    const client = makeMockClient();
    const result = await resolveLocalImages(md, client, tmpDir);
    expect(result).toBe(md);
    expect(client.createDirectUpload).not.toHaveBeenCalled();
  });

  it("resolves a relative path against cwd", async () => {
    makeFile(tmpDir, "diagram.png");
    const client = makeMockClient();
    const md = "![다이어그램](./diagram.png)";
    const result = await resolveLocalImages(md, client, tmpDir);
    expect(result).toBe(
      "![다이어그램](https://class.codle.io/rails/active_storage/blobs/redirect/sid-diagram.png/diagram.png)",
    );
    expect(client.createDirectUpload).toHaveBeenCalledTimes(1);
  });

  it("resolves bare filename and parent-dir relative paths against cwd", async () => {
    makeFile(tmpDir, "sub/child.png");
    makeFile(tmpDir, "root.png");
    const client = makeMockClient();
    const subDir = join(tmpDir, "sub");
    makeFile(subDir, "sibling.png"); // actually: tmpDir/sub/sibling.png

    // cwd = tmpDir/sub
    const md =
      "![a](child.png) ![b](../root.png) ![c](./sibling.png)";
    const result = await resolveLocalImages(md, makeMockClient(), subDir);

    expect(result).toContain("redirect/sid-child.png/child.png");
    expect(result).toContain("redirect/sid-root.png/root.png");
    expect(result).toContain("redirect/sid-sibling.png/sibling.png");
    expect(result).not.toContain("(child.png)");
    expect(result).not.toContain("(../root.png)");
  });

  it("resolves absolute paths as-is", async () => {
    const absPath = makeFile(tmpDir, "cover.jpg");
    const md = `![커버](${absPath})`;
    const client = makeMockClient();
    const result = await resolveLocalImages(md, client, "/some/unrelated/cwd");
    expect(result).toContain("redirect/sid-cover.jpg/cover.jpg");
  });

  it("preserves alt text after substitution", async () => {
    makeFile(tmpDir, "img.png");
    const client = makeMockClient();
    const result = await resolveLocalImages(
      "![매우 길고 한글이 섞인 alt](./img.png)",
      client,
      tmpDir,
    );
    expect(result).toMatch(/^!\[매우 길고 한글이 섞인 alt\]\(/);
  });

  it("uploads multiple local images in parallel and leaves remote ones untouched", async () => {
    makeFile(tmpDir, "a.png");
    makeFile(tmpDir, "b.png");
    const client = makeMockClient();
    const md =
      "![local a](./a.png) ![remote](https://example.com/r.png) ![local b](./b.png)";
    const result = await resolveLocalImages(md, client, tmpDir);

    expect(result).toContain("redirect/sid-a.png/a.png");
    expect(result).toContain("redirect/sid-b.png/b.png");
    expect(result).toContain("https://example.com/r.png");
    expect(client.createDirectUpload).toHaveBeenCalledTimes(2);
  });

  it("throws with resolved absolute path in the message when file is missing", async () => {
    const client = makeMockClient();
    const md = "![x](./nonexistent.png)";
    await expect(resolveLocalImages(md, client, tmpDir)).rejects.toThrow(
      new RegExp(
        `이미지 업로드 실패.*src="\\./nonexistent\\.png".*${tmpDir.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        )}`,
      ),
    );
  });

  it("ignores regular markdown links (no bang prefix)", async () => {
    const client = makeMockClient();
    const md = "[doc link](./doc.md) and ![](./img.png)";
    makeFile(tmpDir, "img.png");
    const result = await resolveLocalImages(md, client, tmpDir);
    expect(result).toContain("[doc link](./doc.md)");
    expect(result).toContain("redirect/sid-img.png/img.png");
    expect(client.createDirectUpload).toHaveBeenCalledTimes(1);
  });
});
