import { Flags } from "@oclif/core";

import { CodleClient } from "../../api/client.js";
import { CodleAPIError } from "../../api/errors.js";
import {
  buildJsonApiPayload,
  extractList,
  extractSingle,
} from "../../api/models.js";
import { BaseCommand } from "../../base-command.js";
import { convertFromMarkdown } from "../../lexical/index.js";

interface ActivitiableInfo {
  type: string;
  id: string;
}

async function resolveActivitiable(
  client: CodleClient,
  activityId: string,
): Promise<ActivitiableInfo> {
  const resp = await client.request("GET", `/api/v1/activities/${activityId}`, {
    params: { include: "activitiable" },
  });
  const actData = (resp.data as Record<string, unknown>) || {};
  const relationships =
    (actData.relationships as Record<string, unknown>) || {};
  const activitiable =
    (relationships.activitiable as Record<string, unknown>) || {};
  const rel = (activitiable.data as Record<string, unknown>) || {};
  const id = String(rel.id || "");
  const rawType = String(rel.type || "");
  if (!id || !rawType) {
    throw new Error(`활동 ${activityId}에서 activitiable을 찾을 수 없습니다.`);
  }
  // snake_case → PascalCase
  const type = rawType
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  return { type, id };
}

export default class ActivitiableUpdate extends BaseCommand {
  static description = "활동의 activitiable 속성을 업데이트합니다.";

  static flags = {
    "activity-id": Flags.string({
      required: true,
      description: "활동 ID",
    }),
    content: Flags.string({
      description: "Board 안내문 또는 Sheet 지시문 (markdown)",
    }),
    name: Flags.string({ description: "Board 이름" }),
    url: Flags.string({ description: "외부 URL (Embedded/Video)" }),
    goals: Flags.string({
      description: "학습목표 (markdown)",
      multiple: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ActivitiableUpdate);
    let info: ActivitiableInfo;
    try {
      info = await resolveActivitiable(this.client, flags["activity-id"]);
    } catch (e) {
      if (e instanceof CodleAPIError) {
        this.error(`Activity 조회 실패: ${e.detail}`, { exit: 1 });
      }
      if (e instanceof Error) {
        this.error(e.message, { exit: 1 });
      }
      throw e;
    }

    if (info.type === "BoardActivity") {
      if (flags.content === undefined && flags.name === undefined) {
        this.error(
          "BoardActivity: content 또는 name 중 하나 이상 필요합니다.",
          { exit: 1 },
        );
      }
      const boardsResp = await this.client.listBoards({
        "filter[boardable_type]": "Activity",
        "filter[boardable_id]": flags["activity-id"],
      });
      const boards = extractList(boardsResp);
      if (!boards.length) {
        this.error(`활동 ${flags["activity-id"]}에 연결된 Board가 없습니다.`, {
          exit: 1,
        });
      }
      const boardId = String(boards[0].id);
      const attrs: Record<string, unknown> = {};
      if (flags.content !== undefined)
        attrs.lexical = convertFromMarkdown(flags.content);
      if (flags.name !== undefined) attrs.name = flags.name;
      const payload = buildJsonApiPayload("boards", attrs, boardId);
      const response = await this.client.updateBoard(
        boardId,
        payload as Record<string, unknown>,
      );
      const board = extractSingle(response);
      this.output(board);
      return;
    }

    if (info.type === "SheetActivity") {
      if (flags.content === undefined) {
        this.error("SheetActivity: content는 필수입니다.", { exit: 1 });
      }
      const lexical = convertFromMarkdown(flags.content!);
      const payload = buildJsonApiPayload(
        "sheet_activities",
        { description: lexical },
        info.id,
      );
      const response = await this.client.updateSheetActivity(
        info.id,
        payload as Record<string, unknown>,
      );
      const sheet = extractSingle(response);
      this.output(sheet);
      return;
    }

    if (info.type === "EmbeddedActivity") {
      if (flags.url === undefined && flags.goals === undefined) {
        this.error(
          "EmbeddedActivity: url 또는 goals 중 하나 이상 필요합니다.",
          { exit: 1 },
        );
      }
      const attrs: Record<string, unknown> = {};
      if (flags.url !== undefined) attrs.url = flags.url;
      if (flags.goals !== undefined) {
        attrs.goals = flags.goals.map((g) => convertFromMarkdown(g));
      }
      const payload = buildJsonApiPayload(
        "embedded_activities",
        attrs,
        info.id,
      );
      const response = await this.client.updateEmbeddedActivity(
        info.id,
        payload as Record<string, unknown>,
      );
      const embedded = extractSingle(response);
      this.output(embedded);
      return;
    }

    if (info.type === "VideoActivity") {
      if (flags.url === undefined) {
        this.error("VideoActivity: url은 필수입니다.", { exit: 1 });
      }
      const payload = buildJsonApiPayload(
        "video_activities",
        { url: flags.url },
        info.id,
      );
      await this.client.request("PUT", `/api/v1/video_activities/${info.id}`, {
        json: payload,
      });
      this.output({ id: info.id, activity_id: flags["activity-id"] });
      return;
    }

    this.error(
      `${info.type}은 activitiable update에서 지원하지 않는 유형입니다.`,
      { exit: 1 },
    );
  }
}
