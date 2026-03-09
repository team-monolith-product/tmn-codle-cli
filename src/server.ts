import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAllTools } from "./tools/register.js";
import { registerAllResources } from "./resources/register.js";

const SERVER_INFO = {
  name: "Codle",
  version: "1.0.0",
};

const SERVER_OPTIONS = {
  instructions: `Codle는 인터랙티브 학습 플랫폼입니다.

## 용어 매핑

| 서비스 용어 | 개발 용어 |
|---|---|
| 코스, 자료 | Material |
| 활동 | Activity |
| 태그 | Tag |
| 갈림길 | ActivityTransition (with level) |
| 코스 흐름 | ActivityTransition (linear) |

활동 유형 (Activity 접미사 생략 가능): 퀴즈=Quiz, 교안=Html, 코딩=Studio, 보드=Board, 활동지=Sheet, 영상=Video, 엔트리=Entry, 스크래치=Scratch, PDF=Pdf, 외부URL=Embedded`,
};

export function createServer(): McpServer {
  const server = new McpServer(SERVER_INFO, SERVER_OPTIONS);
  registerAllTools(server);
  registerAllResources(server);
  return server;
}
