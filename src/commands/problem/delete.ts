import { Args, Flags } from "@oclif/core";

import { BaseCommand } from "../../base-command.js";

export default class ProblemDelete extends BaseCommand {
  static description = "문제를 삭제합니다.";

  static examples = [
    "<%= config.bin %> <%= command.id %> 789",
    "<%= config.bin %> <%= command.id %> --problem-id 789",
  ];

  static args = {
    id: Args.string({ description: "문제 ID" }),
  };

  static flags = {
    "problem-id": Flags.string({
      description: "문제 ID (또는 첫 번째 인자로 전달)",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProblemDelete);
    const problemId = args.id ?? flags["problem-id"];
    if (!problemId) {
      this.error("문제 ID를 인자 또는 --problem-id로 지정하세요.", { exit: 1 });
    }

    await this.client.deleteProblem(problemId);
    this.output({ id: problemId, deleted: true });
  }
}
