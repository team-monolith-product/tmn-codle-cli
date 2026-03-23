import { Args, Flags } from "@oclif/core";

import { extractSingle } from "../../api/models.js";
import { BaseCommand } from "../../base-command.js";

export default class ActivityDuplicate extends BaseCommand {
  static description = "활동(Activity)을 복제합니다.";

  static examples = [
    "<%= config.bin %> <%= command.id %> 456",
    "<%= config.bin %> <%= command.id %> --activity-id 456",
  ];

  static args = {
    id: Args.string({ description: "활동 ID" }),
  };

  static flags = {
    "activity-id": Flags.string({
      description: "복제할 활동 ID (또는 첫 번째 인자로 전달)",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ActivityDuplicate);
    const activityId = args.id ?? flags["activity-id"];
    if (!activityId) {
      this.error("활동 ID를 인자 또는 --activity-id로 지정하세요.", {
        exit: 1,
      });
    }

    const response = await this.client.duplicateActivity(activityId);
    const activity = extractSingle(response);
    this.output(activity);
  }
}
