import { describe, it, expect, vi, beforeEach } from "vitest";
import { CodleAPIError } from "../src/api/errors.js";
import { makeJsonApiResponse, makeJsonApiListResponse } from "./helpers.js";

const mockClient = {
  request: vi.fn(),
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

import ScratchActivityGoalList from "../src/commands/scratch-activity-goal/list.js";
import ScratchActivityGoalCreate from "../src/commands/scratch-activity-goal/create.js";
import { runCommand } from "./run-command.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("scratch-activity-goal list", () => {
  it("목표 목록 조회 성공", async () => {
    mockClient.request.mockResolvedValue(
      makeJsonApiListResponse("scratch_activity_goal", [
        { id: "g1", position: 0 },
        { id: "g2", position: 1 },
      ]),
    );

    const output = await runCommand(ScratchActivityGoalList, [
      "--scratch-activity-id",
      "sa-1",
    ]);
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe("g1");
    expect(parsed[1].id).toBe("g2");

    expect(mockClient.request).toHaveBeenCalledWith(
      "GET",
      "/api/v1/scratch_activity_goals",
      {
        params: { "filter[scratch_activity_id]": "sa-1" },
      },
    );
  });

  it("API 에러 처리", async () => {
    mockClient.request.mockRejectedValue(new CodleAPIError(403, "Forbidden"));

    const output = await runCommand(ScratchActivityGoalList, [
      "--scratch-activity-id",
      "sa-1",
    ]);
    const parsed = JSON.parse(output);
    expect(parsed.error).toBe(true);
  });
});

describe("scratch-activity-goal create", () => {
  it("목표 생성 성공 (markdown → Lexical 변환)", async () => {
    mockClient.request.mockResolvedValue(
      makeJsonApiResponse("scratch_activity_goal", "g1", { position: 0 }),
    );

    const output = await runCommand(ScratchActivityGoalCreate, [
      "--scratch-activity-id",
      "sa-1",
      "--content",
      "# 목표 설명",
      "--position",
      "0",
    ]);
    const parsed = JSON.parse(output);
    expect(parsed.id).toBe("g1");

    const call = mockClient.request.mock.calls[0];
    expect(call[0]).toBe("POST");
    expect(call[1]).toBe("/api/v1/scratch_activity_goals");
    const payload = call[2].json;
    expect(payload.data.attributes.scratch_activity_id).toBe("sa-1");
    expect(payload.data.attributes.content).toBeDefined();
    expect(payload.data.attributes.content.root).toBeDefined();
    expect(payload.data.attributes.position).toBe(0);
  });

  it("API 에러 처리", async () => {
    mockClient.request.mockRejectedValue(
      new CodleAPIError(422, "Validation failed"),
    );

    const output = await runCommand(ScratchActivityGoalCreate, [
      "--scratch-activity-id",
      "sa-1",
      "--content",
      "목표",
      "--position",
      "0",
    ]);
    const parsed = JSON.parse(output);
    expect(parsed.error).toBe(true);
  });
});
