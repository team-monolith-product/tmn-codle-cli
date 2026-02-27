# Codle MCP Server

> 기술 스택, 구조, 인증: [README.md](README.md) 참고

## 명령어

- `npm run build` — TypeScript 빌드 (dist/)
- `npm test` — 전체 테스트
- `npm run typecheck` — 타입 체크만

## API 제약사항

- **api/v1만 사용**: `/api/v1/*` 엔드포인트만 사용. `/admin/v1/*`은 절대 사용 불가.

## 수정 원칙

- **소스코드 기반 수정**: API 계약이 불확실할 때 반드시 Rails/React 소스를 확인한 뒤 수정한다.
  - Rails 백엔드: `jce-class-rails` (controller, serializer, routes, filter 등)
  - React 프론트엔드: `jce-codle-react` (API 호출 패턴, 파라미터 형식 등)
- **trial-and-error 금지**: 추측으로 코드를 수정하고 API를 찔러보는 식의 반복을 하지 않는다.
  소스를 읽고 정확한 원인을 파악한 뒤 한 번에 수정한다.
