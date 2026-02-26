import { createServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { server } from "./server.js";
import { registerAllTools } from "./tools/register.js";
import { requestContext } from "./context.js";

registerAllTools(server);

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

await server.connect(transport);

const httpServer = createServer(async (req, res) => {
  const url = req.url ?? "";

  if (url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (url === "/mcp") {
    const authHeader = req.headers.authorization ?? "";
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    await requestContext.run({ accessToken }, () =>
      transport.handleRequest(req, res)
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

httpServer.listen(config.port, () => {
  logger.info("codle-mcp HTTP 서버 시작 (port=%d)", config.port);
});
