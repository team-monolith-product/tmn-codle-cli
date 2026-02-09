from codle_mcp.api.client import client
from codle_mcp.api.models import extract_list
from codle_mcp.app import mcp

TAG_DOMAINS = {
    0: "problem",
    1: "material",
    2: "standard_concept",
    3: "difficulty",
    4: "school_level",
    5: "metadata",
    6: "major_chapter",
    7: "category",
    8: "material_bundle_topic",
    9: "material_bundle_category",
    10: "material_bundle_language",
}


@mcp.tool()
async def manage_tags(
    domain: str | None = None,
    query: str | None = None,
    page_size: int = 50,
    page_number: int = 1,
) -> str:
    """태그(Tag) 목록을 조회합니다.

    태그는 자료, 문제, 시리즈에 연결하여 분류/검색에 활용합니다.
    자료나 문제에 태그를 연결하려면 해당 리소스의 create/update 시 tag_ids를 사용하세요.

    사용 가능한 태그 도메인:
    - problem: 문제용 태그
    - material: 자료용 태그
    - difficulty: 난이도 태그
    - school_level: 학교 수준 태그
    - category: 카테고리 태그
    - material_bundle_topic: 시리즈 주제 태그
    - material_bundle_category: 시리즈 카테고리 태그

    Args:
        domain: 태그 도메인 필터 (위 목록 참조)
        query: 태그 이름 검색 키워드
        page_size: 페이지당 결과 수 (기본 50, 최대 100)
        page_number: 페이지 번호 (1부터 시작)
    """
    domain_map = {v: k for k, v in TAG_DOMAINS.items()}

    params: dict = {
        "page[size]": min(page_size, 100),
        "page[number]": page_number,
    }
    if domain and domain in domain_map:
        params["filter[domain_eq]"] = domain_map[domain]
    if query:
        params["filter[name_cont]"] = query

    response = await client.list_tags(params)
    tags = extract_list(response)

    if not tags:
        return "태그가 없습니다."

    lines = [f"태그 목록 ({len(tags)}건):"]
    for t in tags:
        tag_domain = TAG_DOMAINS.get(t.get("domain", 0), "unknown")
        lines.append(f"  [{t['id']}] {t.get('name', '(무제)')} (domain: {tag_domain})")
    return "\n".join(lines)
