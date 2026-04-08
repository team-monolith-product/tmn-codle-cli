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
    const result = await resolveLocalImages(md, client);
    expect(result).toBe(md);
    expect(client.createDirectUpload).not.toHaveBeenCalled();
  });

  it("leaves URL-scheme srcs untouched (http/https/data/file/mailto)", async () => {
    const md = [
      "![a](https://example.com/a.png)",
      "![b](http://example.com/b.png)",
      "![c](data:image/png;base64,AAA)",
      "![d](file:///etc/passwd)",
      "![e](mailto:foo@bar)",
    ].join("\n");
    const client = makeMockClient();
    const result = await resolveLocalImages(md, client);
    expect(result).toBe(md);
    expect(client.createDirectUpload).not.toHaveBeenCalled();
  });

  it("uploads an absolute path", async () => {
    const absPath = makeFile(tmpDir, "diagram.png");
    const client = makeMockClient();
    const md = `![다이어그램](${absPath})`;
    const result = await resolveLocalImages(md, client);
    expect(result).toBe(
      "![다이어그램](https://class.codle.io/rails/active_storage/blobs/redirect/sid-diagram.png/diagram.png)",
    );
    expect(client.createDirectUpload).toHaveBeenCalledTimes(1);
  });

  it("rejects relative './' paths with a clear error", async () => {
    const client = makeMockClient();
    const md = "![x](./img.png)";
    await expect(resolveLocalImages(md, client)).rejects.toThrow(
      /절대 경로.*src="\.\/img\.png"/,
    );
    expect(client.createDirectUpload).not.toHaveBeenCalled();
  });

  it("rejects bare-filename paths as relative", async () => {
    const client = makeMockClient();
    const md = "![x](img.png)";
    await expect(resolveLocalImages(md, client)).rejects.toThrow(
      /절대 경로.*src="img\.png"/,
    );
    expect(client.createDirectUpload).not.toHaveBeenCalled();
  });

  it("rejects parent-dir relative paths", async () => {
    const client = makeMockClient();
    const md = "![x](../img.png)";
    await expect(resolveLocalImages(md, client)).rejects.toThrow(
      /절대 경로.*src="\.\.\/img\.png"/,
    );
    expect(client.createDirectUpload).not.toHaveBeenCalled();
  });

  it("preserves alt text after substitution", async () => {
    const absPath = makeFile(tmpDir, "img.png");
    const client = makeMockClient();
    const result = await resolveLocalImages(
      `![매우 길고 한글이 섞인 alt](${absPath})`,
      client,
    );
    expect(result).toMatch(/^!\[매우 길고 한글이 섞인 alt\]\(/);
  });

  it("uploads multiple absolute paths in parallel and leaves remote ones untouched", async () => {
    const aPath = makeFile(tmpDir, "a.png");
    const bPath = makeFile(tmpDir, "b.png");
    const client = makeMockClient();
    const md = `![local a](${aPath}) ![remote](https://example.com/r.png) ![local b](${bPath})`;
    const result = await resolveLocalImages(md, client);

    expect(result).toContain("redirect/sid-a.png/a.png");
    expect(result).toContain("redirect/sid-b.png/b.png");
    expect(result).toContain("https://example.com/r.png");
    expect(client.createDirectUpload).toHaveBeenCalledTimes(2);
  });

  it("throws with absolute path in the message when file is missing", async () => {
    const client = makeMockClient();
    const missing = join(tmpDir, "nonexistent.png");
    const md = `![x](${missing})`;
    await expect(resolveLocalImages(md, client)).rejects.toThrow(
      new RegExp(
        `이미지 업로드 실패.*src="${missing.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        )}"`,
      ),
    );
  });

  it("ignores regular markdown links (no bang prefix)", async () => {
    const client = makeMockClient();
    const absPath = makeFile(tmpDir, "img.png");
    const md = `[doc link](./doc.md) and ![](${absPath})`;
    const result = await resolveLocalImages(md, client);
    expect(result).toContain("[doc link](./doc.md)");
    expect(result).toContain("redirect/sid-img.png/img.png");
    expect(client.createDirectUpload).toHaveBeenCalledTimes(1);
  });

  it("fails fast on mixed absolute + relative paths without uploading anything", async () => {
    const absPath = makeFile(tmpDir, "a.png");
    const client = makeMockClient();
    const md = `![a](${absPath}) ![b](./b.png)`;
    await expect(resolveLocalImages(md, client)).rejects.toThrow(
      /절대 경로.*src="\.\/b\.png"/,
    );
    expect(client.createDirectUpload).not.toHaveBeenCalled();
  });
});
