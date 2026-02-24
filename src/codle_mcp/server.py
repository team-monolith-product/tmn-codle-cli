from codle_mcp.app import mcp  # noqa: F401
from codle_mcp.log import logger

# Tool 등록 - import 시 @mcp.tool() 데코레이터가 실행됨
import codle_mcp.tools.materials  # noqa: E402, F401
import codle_mcp.tools.problems  # noqa: E402, F401
import codle_mcp.tools.activities  # noqa: E402, F401
import codle_mcp.tools.bundles  # noqa: E402, F401
import codle_mcp.tools.tags  # noqa: E402, F401


def main():
    logger.info("codle-mcp 서버 시작")
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
