import { Args, Flags } from "@oclif/core";

import { BaseCommand } from "../../base-command.js";
import { extractSingle } from "../../api/models.js";

export default class MaterialDuplicate extends BaseCommand {
  static description = "자료(Material)를 복제합니다.";

  static examples = [
    "<%= config.bin %> <%= command.id %> 123",
    "<%= config.bin %> <%= command.id %> --material-id 123",
  ];

  static args = {
    id: Args.string({ description: "자료 ID" }),
  };

  static flags = {
    "material-id": Flags.string({
      description: "복제할 원본 자료 ID (또는 첫 번째 인자로 전달)",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MaterialDuplicate);
    const materialId = args.id ?? flags["material-id"];
    if (!materialId) {
      this.error("자료 ID를 인자 또는 --material-id로 지정하세요.", {
        exit: 1,
      });
    }

    const response = await this.client.duplicateMaterial(materialId);
    const mat = extractSingle(response);

    this.output(mat);
  }
}
