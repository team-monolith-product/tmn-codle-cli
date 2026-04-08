import { isAbsolute } from "node:path";

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

// AIDEV-NOTE: 호출자(Claude Code 등)는 절대 경로로 이미지 src를 넘겨야 한다.
// CLI가 process.cwd() 기준으로 상대 경로를 resolve하지 않는 이유:
// 호출 디렉토리에 의존하는 동작을 숨기면 에이전트가 의도와 다른 파일을 올릴 위험이 있다.
// URL 스키마(http/https/data 등)는 업로드 없이 그대로 둔다.
export async function resolveLocalImages(
  markdown: string,
  client: CodleClient,
): Promise<string> {
  const matches = Array.from(markdown.matchAll(IMAGE_REGEX));
  if (matches.length === 0) return markdown;

  const localMatches = matches.filter((m) => !hasUrlScheme(m[2]));
  if (localMatches.length === 0) return markdown;

  // 먼저 모든 경로를 검증해서 상대 경로가 하나라도 있으면 업로드 전에 실패한다.
  for (const m of localMatches) {
    const src = m[2];
    if (!isAbsolute(src)) {
      throw new Error(
        `이미지 경로는 절대 경로여야 합니다 (src="${src}"). ` +
          `CLI 호출 전에 절대 경로로 변환하세요.`,
      );
    }
  }

  const uploads = await Promise.all(
    localMatches.map(async (match) => {
      const src = match[2];
      try {
        const blob = await directUploadFile(client, src);
        return { originalSrc: src, newUrl: blob.url };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`이미지 업로드 실패 (src="${src}"): ${msg}`);
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
