export { CONSTITUTION, DIAG_RULES } from "./constitution";
export { KB, KB_NOTE, knowledgePack } from "./knowledge";
export { DIA, TON, personaLine } from "./persona";
export { buildSystemPrompt } from "./system";
export { callGemini, testConnection, type GeminiContent, type GeminiMode, type GeminiResult } from "./gemini-client";
export {
  buildDiagnoseUserPrompt,
  type DiagnosePromptInput,
  type DiagnosisSummary,
  type WeakItemRef,
  type SimInfo,
} from "./prompts/diagnose-prompt";
export {
  buildConsultUserPrompt,
  historyToContents,
  type ConsultPromptInput,
  type HistoryTurn,
} from "./prompts/consult-prompt";
