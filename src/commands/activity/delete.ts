import { Args, Flags } from "@oclif/core";

import { BaseCommand } from "../../base-command.js";

export default class ActivityDelete extends BaseCommand {
  static description = "활동(Activity)을 삭제합니다.";

  static examples = [
    "<%= config.bin %> <%= command.id %> 456",
    "<%= config.bin %> <%= command.id %> --activity-id 456",
  ];

  static args = {
    id: Args.string({ description: "활동 ID" }),
  };

  static flags = {
    "activity-id": Flags.string({
      description: "삭제할 활동 ID (또는 첫 번째 인자로 전달)",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ActivityDelete);
    const activityId = args.id ?? flags["activity-id"];
    if (!activityId) {
      this.error("활동 ID를 인자 또는 --activity-id로 지정하세요.", {
        exit: 1,
      });
    }

    await this.client.deleteActivity(activityId);
    this.output({ id: activityId, deleted: true });
  }
}
