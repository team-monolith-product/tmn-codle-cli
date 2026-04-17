import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeJsonApiResponse } from "./helpers.js";

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

import ActivityUpload from "../src/commands/activity/upload.js";
import { runCommand } from "./run-command.js";

function stubResolveStudioActivity(studioId: string): void {
  // GET /api/v1/activities/:id?include=activitiable → JSON:API response
  mockClient.request.mockResolvedValueOnce(
    makeJsonApiResponse(
      "activity",
      "456",
      {},
      {
        activitiable: { data: { type: "studio_activity", id: studioId } },
      },
    ),
  );
}

describe("activity upload", () => {
  let tmpDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tmpDir = mkdtempSync(join(tmpdir(), "activity-upload-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  it("resolves studio_activity_id then sends multipart POST", async () => {
    const filePath = join(tmpDir, "main.py");
    writeFileSync(filePath, "print('hello')\n");

    stubResolveStudioActivity("99");
    mockClient.request.mockResolvedValueOnce({
      filename: "main.py",
      relative_path: "main.py",
      byte_size: 15,
      content_type: "text/x-python",
    });

    await runCommand(ActivityUpload, ["456", "--file-path", filePath]);

    expect(mockClient.request).toHaveBeenCalledTimes(2);

    // 1st call: resolve activity → studio_activity
    const [m1, u1] = mockClient.request.mock.calls[0];
    expect(m1).toBe("GET");
    expect(u1).toBe("/api/v1/activities/456");

    // 2nd call: upload
    const [m2, u2, opts] = mockClient.request.mock.calls[1];
    expect(m2).toBe("POST");
    expect(u2).toBe("/api/v1/studio_activities/99/upload");

    const formData = opts.formData as FormData;
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("relative_path")).toBe(".");
    expect((formData.get("file") as File).name).toBe("main.py");
  });

  it("forwards --path as relative_path", async () => {
    const filePath = join(tmpDir, "data.csv");
    writeFileSync(filePath, "a,b\n1,2\n");

    stubResolveStudioActivity("99");
    mockClient.request.mockResolvedValueOnce({});

    await runCommand(ActivityUpload, [
      "456",
      "--file-path",
      filePath,
      "--path",
      "data/problem1",
    ]);

    const [, , opts] = mockClient.request.mock.calls[1];
    const formData = opts.formData as FormData;
    expect(formData.get("relative_path")).toBe("data/problem1");
  });

  it("rejects disallowed extensions before hitting the server", async () => {
    const filePath = join(tmpDir, "script.sh");
    writeFileSync(filePath, "#!/bin/sh\n");

    await runCommand(ActivityUpload, ["456", "--file-path", filePath]);

    expect(mockClient.request).not.toHaveBeenCalled();
  });

  it("rejects files larger than MAX_BYTE_SIZE before hitting the server", async () => {
    const filePath = join(tmpDir, "big.py");
    writeFileSync(filePath, Buffer.alloc(10 * 1024 * 1024 + 1));

    await runCommand(ActivityUpload, ["456", "--file-path", filePath]);

    expect(mockClient.request).not.toHaveBeenCalled();
  });

  it("errors when local file does not exist", async () => {
    const missing = join(tmpDir, "no.py");

    await runCommand(ActivityUpload, ["456", "--file-path", missing]);
    expect(mockClient.request).not.toHaveBeenCalled();
  });
});
