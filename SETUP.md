# Codle MCP 설치 가이드

## 요구사항

- Node.js 22+

## 설치 & 빌드

```bash
npm install
npm run build
```

## 환경변수

`.env` 파일 또는 환경변수로 설정한다. `.env.example` 참고.

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `CODLE_API_URL` | `https://class.dev.codle.io` | Codle API 서버 URL |
| `CODLE_PORT` | `3000` | MCP 서버 포트 |
| `CODLE_LOG_LEVEL` | `INFO` | 로그 레벨 (`ERROR`, `WARNING`, `INFO`, `DEBUG`) |

## 서버 실행

```bash
node dist/index.js
```

## MCP 클라이언트 설정

### Claude Code

프로젝트 `.mcp.json`에 추가:

```json
{
  "mcpServers": {
    "codle": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`에 동일한 JSON을 추가한다.

## 인증

서버는 토큰을 환경변수로 보관하지 않는다. MCP 클라이언트가 HTTP 요청마다 `Authorization: Bearer <token>` 헤더로 전달한다.

토큰 발급은 인프라팀에 문의.

## 사용 예시

설정 완료 후 Claude에게 자연어로 요청:

- "파이썬 기초 자료 검색해줘"
- "새 자료 만들어줘. 이름은 'React 입문'"
- "이 자료에 퀴즈 활동 추가해줘"

## 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 401 Unauthorized | 토큰 누락/만료 | MCP 클라이언트의 Authorization 헤더 확인 |
| Connection refused | API URL 오류 | `CODLE_API_URL` 확인 |
| Cannot find module | 빌드 안 됨 | `npm run build` 실행 |
