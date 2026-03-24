# Codle CLI

사내 이용자(고객팀, 컨텐츠팀)를 위한 Codle CLI.
AI 에이전트(Claude Code 등)가 bash로 자료를 조회/생성/수정할 수 있다.

## 설치

```bash
curl -fsSL "https://raw.githubusercontent.com/team-monolith-product/tmn-codle-mcp/main/install.sh" | bash
codle auth login
```

## 아키텍처

```
AI Agent (Claude Code 등)
  └─ bash: codle <command> [flags]
       └─ HTTP/fetch (JSON:API)
            └─ jce-class-rails (/api/v1/*)
                 └─ user-rails (토큰 검증)
```

인증은 `codle auth login`으로 수행. 토큰은 `~/.config/codle/`에 암호화 저장되며 만료 시 자동 갱신된다.

## 커맨드 목록

```bash
codle --help
```

| Topic                | 설명                                                      |
| -------------------- | --------------------------------------------------------- |
| `auth`               | 인증 관리 (로그인, 로그아웃, 상태 확인)                   |
| `material`           | 자료 검색, 조회, 생성, 수정, 복제                         |
| `activity`           | 활동 CRUD, 코스 흐름, 갈림길 설정                         |
| `activitiable`       | 활동 유형별 속성 업데이트 (Board, Sheet, Embedded, Video) |
| `problem`            | 문제 CRUD                                                 |
| `problem-collection` | ProblemCollection 문제 목록 동기화                        |
| `tag`                | 태그 검색                                                 |
| `html-activity-page` | 교안 페이지 동기화                                        |
| `docs`               | 문서 및 가이드 출력                                       |

## E2E 테스트

자연어 프롬프트가 올바른 CLI bash 호출을 트리거하는지 검증하는 테스트.
커맨드 인터페이스(flags, description, examples) 변경 시 실행한다.

> 상세 가이드: [e2e/README.md](e2e/README.md)

## 디버깅

CLI 로그는 stderr로 출력된다:

```bash
CODLE_LOG_LEVEL=DEBUG codle tag search 파이썬 2>debug.log
```
