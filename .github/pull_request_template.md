<!--
📌 PR 제목 컨벤션 (자동 버전 관리에 사용됩니다)

  <type>: <설명>

  type:
    feat     → 새 기능 (minor 버전 bump)
    fix      → 버그 수정 (patch 버전 bump)
    perf     → 성능 개선 (patch 버전 bump)
    chore, docs, refactor, test, ci, style, build → 버전 변경 없음

  breaking change:
    feat!: <설명> → major 버전 bump

  예시:
    feat: 자료 검색 커맨드 추가
    fix: 로그인 토큰 갱신 오류 수정
    feat!: 인증 방식 변경
-->

# 변경 사항

<!-- 무엇을 왜 변경했는지 설명합니다. -->
<!-- CLI 커맨드가 추가/변경/삭제된 경우 아래 형식의 표를 포함하세요:

| 커맨드 | 상태 | 설명 |
|--------|------|------|
| `codle material search` | 신규/변경/삭제 | 한 줄 설명 |
-->

# 설계 결정

<!-- 커맨드별로 소제목을 만들고, 시그니처 + API 흐름을 묶어 작성합니다. -->

<!-- 예시:

### `codle material search`

설계 의도 한 줄 설명

```
codle material search [query] [--query <value>] [--tag-ids <value>...] [--is-public]
```

**API 흐름**:

| 단계 | 엔드포인트 | 용도 |
|------|-----------|------|
| 1 | `GET /api/v1/materials` | 자료 검색 |
-->

### 추가 내용

<!-- 인증/인가, 인프라 등 커맨드별 섹션에 해당하지 않는 설계 결정이 있다면 -->

# Changelog

<!-- ⚠️ 이 섹션은 자동으로 CHANGELOG.md에 추가됩니다. -->
<!-- 해당하는 카테고리만 남기고 나머지는 삭제하세요. 버전 bump이 없는 PR은 이 섹션을 비워두세요. -->

### Added

-

### Fixed

-

### Changed

-

<!-- 커맨드 인터페이스(flags, description, examples) 변경 시 아래 섹션을 추가하세요:
# E2E
- [ ] `/e2e-report` 실행 완료
-->
