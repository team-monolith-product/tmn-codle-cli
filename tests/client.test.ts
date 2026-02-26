import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractErrorDetail } from "../src/api/errors.js";

describe("extractErrorDetail", () => {
  it("HTML error extracts h2", () => {
    const text = `
    <html><body>
    <h2>No route matches [POST] "/api/v1/problem_collections"</h2>
    <p>Some long debug info...</p>
    </body></html>
    `;
    const result = extractErrorDetail(404, "text/html; charset=utf-8", text);
    expect(result).toContain("No route matches");
    expect(result).toContain("HTML 에러 응답");
    expect(result.length).toBeLessThan(200);
  });

  it("HTML error extracts h1", () => {
    const text = "<html><h1>Internal Server Error</h1></html>";
    const result = extractErrorDetail(500, "text/html", text);
    expect(result).toContain("Internal Server Error");
  });

  it("HTML error no heading", () => {
    const text = "<html><body>Something went wrong</body></html>";
    const result = extractErrorDetail(500, "text/html", text);
    expect(result).toContain("알 수 없는 에러");
  });

  it("JSON error passthrough", () => {
    const text = '{"errors": [{"detail": "Validation failed"}]}';
    const result = extractErrorDetail(
      422,
      "application/vnd.api+json",
      text
    );
    expect(result).toContain("Validation failed");
  });

  it("long JSON error truncated", () => {
    const text = "x".repeat(2000);
    const result = extractErrorDetail(422, "application/json", text);
    expect(result.length).toBeLessThan(1100);
    expect(result).toMatch(/\.\.\.$/);
  });
});

describe("CodleClient", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("ensureAuth throws when accessToken is empty", async () => {
    vi.doMock("../src/config.js", () => ({
      config: {
        apiUrl: "https://class.dev.codle.io",
        authUrl: "",
        accessToken: "",
        port: 3000,
        logLevel: "INFO",
      },
    }));

    const { CodleClient } = await import("../src/api/client.js");
    const client = new CodleClient();
    await expect(client.ensureAuth()).rejects.toThrow(
      "CODLE_ACCESS_TOKEN이 설정되지 않았습니다"
    );
  });

  it("ensureAuth succeeds with token and calls fetchUserId once", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "42" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    vi.doMock("../src/config.js", () => ({
      config: {
        apiUrl: "https://class.dev.codle.io",
        authUrl: "https://user.dev.codle.io",
        accessToken: "test-pat-token",
        port: 3000,
        logLevel: "INFO",
      },
    }));

    const { CodleClient } = await import("../src/api/client.js");
    const client = new CodleClient();

    await client.ensureAuth();
    expect(client.userId).toBe("42");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call should not fetch again
    await client.ensureAuth();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it("request does not retry on 401", async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("/api/v1/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: "1" }),
        });
      }
      callCount++;
      return Promise.resolve({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
        headers: new Headers({ "content-type": "text/plain" }),
      });
    });
    vi.stubGlobal("fetch", mockFetch);

    vi.doMock("../src/config.js", () => ({
      config: {
        apiUrl: "https://class.dev.codle.io",
        authUrl: "https://user.dev.codle.io",
        accessToken: "expired-token",
        port: 3000,
        logLevel: "ERROR",
      },
    }));

    const { CodleClient } = await import("../src/api/client.js");
    const client = new CodleClient();

    await expect(
      client.request("GET", "/api/v1/materials")
    ).rejects.toThrow();

    // Should only call the materials endpoint once (no retry)
    expect(callCount).toBe(1);

    vi.unstubAllGlobals();
  });
});
