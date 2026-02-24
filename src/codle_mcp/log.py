"""MCP 서버 로깅 설정.

MCP는 stdio transport를 사용하므로 stdout은 프로토콜 메시지 전용.
로그는 stderr로 출력한다.
"""

import logging
import sys

from codle_mcp.config import settings


def setup_logging() -> logging.Logger:
    logger = logging.getLogger("codle_mcp")
    logger.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%H:%M:%S",
        ))
        logger.addHandler(handler)

    return logger


logger = setup_logging()
