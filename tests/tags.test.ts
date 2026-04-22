import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeJsonApiListResponse } from "./helpers.js";

const mockClient = {
  listTags: vi.fn(),
};
vi.mock("../src/api/client.js", () => ({
  CodleClient: vi.fn(() => mockClient),
}));
vi.mock("../src/auth/token-manager.js", () => ({
  load: () => ({
    access_token: "test-token",
    auth_server_url: "",
    client_id: "",
    refresh_token: "",
    scope: "public",
    created_at: 0,
    expires_in: 99999,
  }),
}));

import TagSearch from "../src/commands/tag/search.js";
import { runCommand } from "./run-command.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("tag search", () => {
  it("valid domain passes oclif validation", async () => {
    mockClient.listTags.mockResolvedValue(
      makeJsonApiListResponse("tag", [
        { id: "1", name: "파이썬", domain: "material" },
      ]),
    );

    const output = await runCommand(TagSearch, ["--domain", "material"]);
    expect(output).toContain("파이썬");

    const callParams = mockClient.listTags.mock.calls[0][0];
    expect(callParams["filter[domain]"]).toBe("material");
  });

  it("invalid domain is rejected by oclif options validation", async () => {
    const output = await runCommand(TagSearch, [
      "--domain",
      "invalid_domain",
    ]);
    const parsed = JSON.parse(output);
    expect(parsed.error).toBe(true);
    expect(parsed.message).toContain("--domain");

    // API should not be called when validation fails
    expect(mockClient.listTags).not.toHaveBeenCalled();
  });

  it("search by keyword", async () => {
    mockClient.listTags.mockResolvedValue(
      makeJsonApiListResponse("tag", [
        { id: "2", name: "파이썬 기초", domain: "standard_concept" },
      ]),
    );

    const output = await runCommand(TagSearch, ["--query", "파이썬"]);
    expect(output).toContain("파이썬 기초");

    const callParams = mockClient.listTags.mock.calls[0][0];
    expect(callParams["filter[name_cont]"]).toBe("파이썬");
  });
});
