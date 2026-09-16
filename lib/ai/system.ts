// システムプロンプトの組み立て：憲法＋知識パック＋診断ルール＋口調ペルソナ。
// v1 api/ai/route.js の `system` 構築を移植。
import { CONSTITUTION, DIAG_RULES } from "./constitution";
import { knowledgePack } from "./knowledge";
import { personaLine } from "./persona";

export function buildSystemPrompt(dialect: string, tone: string): string {
  return [CONSTITUTION, knowledgePack(), DIAG_RULES, personaLine(dialect, tone)].join("\n\n────────\n\n");
}
