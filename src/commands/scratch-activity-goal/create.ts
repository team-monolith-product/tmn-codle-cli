import { Flags } from "@oclif/core";

import { buildJsonApiPayload, extractSingle } from "../../api/models.js";
import { BaseCommand } from "../../base-command.js";
import {
  convertFromMarkdown,
  resolveLocalImages,
} from "../../lexical/index.js";

export default class ScratchActivityGoalCreate extends BaseCommand {
  static description = "스크래치 활동 목표를 생성합니다.";

  static examples = [
    "<%= config.bin %> <%= command.id %> --scratch-activity-id 123 --content '목표 설명' --position 0",
  ];

  static flags = {
    "scratch-activity-id": Flags.string({
      required: true,
      description: "스크래치 활동 ID",
    }),
    content: Flags.string({
      required: true,
      description:
        "목표 본문 (markdown). 로컬 이미지는 `![alt](file:///abs/path.png)` 형식",
    }),
    position: Flags.integer({
      required: true,
      description: "목표 순서 (0부터 시작)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ScratchActivityGoalCreate);
    const resolved = await resolveLocalImages(flags.content, this.client);
    const lexical = convertFromMarkdown(resolved);
    const payload = buildJsonApiPayload("scratch_activity_goals", {
      scratch_activity_id: flags["scratch-activity-id"],
      content: lexical,
      position: flags.position,
    });
    const response = await this.client.request(
      "POST",
      "/api/v1/scratch_activity_goals",
      { json: payload },
    );
    const goal = extractSingle(response);
    this.output(goal);
  }
}
