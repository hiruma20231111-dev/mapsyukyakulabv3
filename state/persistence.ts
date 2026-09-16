// localStorage 永続化（v1 のキー名・値の形をそのまま維持＝既存ユーザーのデータが読める）。
// 純粋関数として切り出し（KVStorage を注入）→ テスト可能。
import type { Answers } from "@/lib/domain/diagnose";

export interface KVStorage {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

// v1 と同一のキー名（変更禁止）
export const LS = {
  key: "ml_key",
  model: "ml_model",
  dialect: "ml_dialect",
  tone: "ml_tone",
  bg: "ml_bg",
  bgInfo: "ml_bg_info",
  answers: "ml_answers",
  aiDiag: "ml_aidiag",
  invite: "ml_invite",
  advisorSetup: "ml_advisor_setup",
  readGuides: "ml_read_guides",
  biz: "ml_biz",
  fs: "ml_fs",
} as const;

export interface Cfg {
  key: string;
  model: string;
  dialect: string;
  tone: string;
}
export interface BgInfo {
  name?: string;
  category?: string;
  rating?: number | null;
  reviewCount?: number | null;
  area?: string;
  query?: string;
}
export interface PersistedState {
  cfg: Cfg;
  background: string;
  bgInfo: BgInfo | null;
  answers: Answers;
  aiDiagText: string;
  invite: string;
  advisorSetup: boolean;
  readGuides: Record<string, boolean>;
  biz: string | null;
  fs: number;
}

export function defaultState(): PersistedState {
  return {
    cfg: { key: "", model: "gemini-2.5-flash", dialect: "std", tone: "polite" },
    background: "",
    bgInfo: null,
    answers: {},
    aiDiagText: "",
    invite: "",
    advisorSetup: false,
    readGuides: {},
    biz: null,
    fs: 1,
  };
}

function parseJSON<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    const v = JSON.parse(s);
    return v == null ? fallback : (v as T);
  } catch {
    return fallback;
  }
}

// 旧バージョンの背景から、設問と重複/検索で取れない項目を除去（v1 page.js の互換処理）
export function cleanLegacyBg(rawBg: string): string {
  return rawBg
    .replace(/\s*\/\s*サイト:[^/]*/g, "")
    .replace(/\s*\/\s*予約:[^/]*/g, "")
    .replace(/\s*\/\s*ビジネス説明文:[^/]*/g, "")
    .replace(/\s*\/\s*投稿\(最新情報\):[^/]*/g, "")
    .trim();
}

// 全 ml_* キーを読み込んで状態を復元
export function loadPersisted(s: KVStorage): PersistedState {
  const d = defaultState();
  const cfg: Cfg = {
    key: s.getItem(LS.key) || d.cfg.key,
    model: s.getItem(LS.model) || d.cfg.model,
    dialect: s.getItem(LS.dialect) || d.cfg.dialect,
    tone: s.getItem(LS.tone) || d.cfg.tone,
  };
  const rawBg = s.getItem(LS.bg) || "";
  const background = cleanLegacyBg(rawBg);
  const fsRaw = parseFloat(s.getItem(LS.fs) || "1");
  return {
    cfg,
    background,
    bgInfo: parseJSON<BgInfo | null>(s.getItem(LS.bgInfo), null),
    answers: parseJSON<Answers>(s.getItem(LS.answers), {}),
    aiDiagText: s.getItem(LS.aiDiag) || "",
    invite: s.getItem(LS.invite) || "",
    advisorSetup: !!s.getItem(LS.advisorSetup),
    readGuides: parseJSON<Record<string, boolean>>(s.getItem(LS.readGuides), {}),
    biz: s.getItem(LS.biz) || null,
    fs: isNaN(fsRaw) ? 1 : fsRaw,
  };
}

// ---- 個別セーバー（v1 と同じ粒度で書き込む）----
export function saveCfg(s: KVStorage, cfg: Partial<Cfg>): void {
  if (cfg.key !== undefined) s.setItem(LS.key, cfg.key);
  if (cfg.model !== undefined) s.setItem(LS.model, cfg.model);
  if (cfg.dialect !== undefined) s.setItem(LS.dialect, cfg.dialect);
  if (cfg.tone !== undefined) s.setItem(LS.tone, cfg.tone);
}
export function saveBackground(s: KVStorage, bg: string): void {
  if (bg) s.setItem(LS.bg, bg);
  else s.removeItem(LS.bg);
}
export function saveBgInfo(s: KVStorage, info: BgInfo | null): void {
  if (info) s.setItem(LS.bgInfo, JSON.stringify(info));
  else s.removeItem(LS.bgInfo);
}
export function saveAnswers(s: KVStorage, answers: Answers): void {
  // v1: 空のときは保存しない（復元を上書きしない）
  if (Object.keys(answers).length) s.setItem(LS.answers, JSON.stringify(answers));
}
export function saveAiDiag(s: KVStorage, text: string): void {
  s.setItem(LS.aiDiag, text);
}
export function saveInvite(s: KVStorage, token: string): void {
  s.setItem(LS.invite, token);
}
export function saveAdvisorSetup(s: KVStorage, flag: boolean): void {
  if (flag) s.setItem(LS.advisorSetup, "1");
  else s.removeItem(LS.advisorSetup);
}
export function saveReadGuides(s: KVStorage, map: Record<string, boolean>): void {
  s.setItem(LS.readGuides, JSON.stringify(map));
}
export function saveBiz(s: KVStorage, biz: string | null): void {
  if (biz) s.setItem(LS.biz, biz);
}
export function saveFs(s: KVStorage, fs: number): void {
  s.setItem(LS.fs, String(fs));
}

// ブラウザの localStorage を安全にラップ（SSR/例外に強い）
export const browserStorage: KVStorage = {
  getItem: (k) => {
    try {
      return typeof window !== "undefined" ? window.localStorage.getItem(k) : null;
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(k, v);
    } catch {}
  },
  removeItem: (k) => {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(k);
    } catch {}
  },
};
