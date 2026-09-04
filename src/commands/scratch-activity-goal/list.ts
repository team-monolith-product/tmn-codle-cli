import { Flags } from "@oclif/core";

import { extractList } from "../../api/models.js";
import { BaseCommand } from "../../base-command.js";

export default class ScratchActivityGoalList extends BaseCommand {
  static description = "스크래치 활동의 목표 목록을 조회합니다.";

  static examples = [
    "<%= config.bin %> <%= command.id %> --scratch-activity-id 123",
  ];

  static flags = {
    "scratch-activity-id": Flags.string({
      required: true,
      description: "스크래치 활동 ID",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ScratchActivityGoalList);
    const response = await this.client.request(
      "GET",
      "/api/v1/scratch_activity_goals",
      {
        params: {
          "filter[scratch_activity_id]": flags["scratch-activity-id"],
        },
      },
    );
    const goals = extractList(response);
    this.output(goals);
  }
}
