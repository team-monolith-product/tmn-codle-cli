import { Flags } from "@oclif/core";

import { extractList } from "../../api/models.js";
import { BaseCommand } from "../../base-command.js";

export default class EntryActivityGoalList extends BaseCommand {
  static description = "엔트리 활동의 목표 목록을 조회합니다.";

  static examples = [
    "<%= config.bin %> <%= command.id %> --entry-activity-id 123",
  ];

  static flags = {
    "entry-activity-id": Flags.string({
      required: true,
      description: "엔트리 활동 ID",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(EntryActivityGoalList);
    const response = await this.client.request(
      "GET",
      "/api/v1/entry_activity_goals",
      {
        params: {
          "filter[entry_activity_id]": flags["entry-activity-id"],
        },
      },
    );
    const goals = extractList(response);
    this.output(goals);
  }
}
