import { resolve as resolvePath } from "node:path";

import type { CodleClient } from "../api/client.js";
import { directUploadFile } from "../api/directUpload.js";

// AIDEV-NOTE: markdown 이미지 매칭 regex. transformers.ts IMAGE와 동일한 문법 범위를 커버.
// src에는 공백이 없다고 가정한다 (markdown 표준).
const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)\s]+)\)/g;

// AIDEV-NOTE: RFC 3986 scheme. http://, https://, data:, file:, mailto: 등 "word:" 접두사를
// URL로 간주하고 로컬 파일 업로드 대상에서 제외한다.
const URL_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

function hasUrlScheme(src: string): boolean {
  return URL_SCHEME_REGEX.test(src);
}

export async function resolveLocalImages(
  markdown: string,
  client: CodleClient,
  cwd: string,
): Promise<string> {
  const matches = Array.from(markdown.matchAll(IMAGE_REGEX));
  if (matches.length === 0) return markdown;

  const localMatches = matches.filter((m) => !hasUrlScheme(m[2]));
  if (localMatches.length === 0) return markdown;

  const uploads = await Promise.all(
    localMatches.map(async (match) => {
      const src = match[2];
      const absPath = resolvePath(cwd, src);
      try {
        const blob = await directUploadFile(client, absPath);
        return { originalSrc: src, newUrl: blob.url };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(
          `이미지 업로드 실패 (src="${src}", 경로="${absPath}"): ${msg}`,
        );
      }
    }),
  );

  const srcToUrl = new Map<string, string>();
  for (const u of uploads) srcToUrl.set(u.originalSrc, u.newUrl);

  return markdown.replace(IMAGE_REGEX, (full, alt: string, src: string) => {
    const newUrl = srcToUrl.get(src);
    if (!newUrl) return full;
    return `![${alt}](${newUrl})`;
  });
}
