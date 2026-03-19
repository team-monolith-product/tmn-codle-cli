import { describe, expect, test } from "../fixtures/cli.js";
import { createMaterial } from "../lib/factory.js";
import { findLastCodleCommand } from "../lib/ndjson.js";

describe("cli: html-activity-page manage", () => {
  test("교안 페이지 설정 커맨드에 활동 ID 포함", async ({ cli, factory }) => {
    const material = await createMaterial(factory);
    const htmlActivitiable = await factory.create("html_activity");
    const activity = await factory.create("activity", {
      name: "E2E CLI Html Activity",
      materialId: material.id,
      activitiableType: "HtmlActivity",
      activitiableId: htmlActivitiable.id,
    });

    const result = await cli.run(
      `교안 활동 ID "${activity.id}"에 페이지를 설정해줘. ` +
        `URL은 "https://example.com/cli-page1"과 "https://example.com/cli-page2"야.`,
    );

    const cmd = findLastCodleCommand(result.toolInteractions);
    expect(cmd).toBeDefined();
    expect(cmd).toMatch(/html-activity-page\s+manage/);
    expect(cmd).toContain(activity.id);
  });
});
