"use client";
// アプリ状態の一元管理（v1 page.js の useState 群＋散らばった localStorage を集約）。
// 各アクションが state 更新と localStorage 保存を同時に行う（キーは v1 互換）。
import { create } from "zustand";
import type { Answers } from "@/lib/domain/diagnose";
import {
  browserStorage as BS,
  loadPersisted,
  defaultState,
  saveCfg,
  saveBackground,
  saveBgInfo,
  saveAnswers,
  saveAiDiag,
  saveInvite,
  saveAdvisorSetup,
  saveReadGuides,
  saveBiz,
  saveFs,
  type Cfg,
  type BgInfo,
} from "./persistence";

export interface AppStore {
  hydrated: boolean;
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

  /** クライアントで localStorage から復元（マウント時に1回） */
  hydrate: () => void;
  setCfg: (patch: Partial<Cfg>) => void;
  setBackground: (bg: string) => void;
  setBgInfo: (info: BgInfo | null) => void;
  setAnswers: (answers: Answers) => void;
  setAiDiagText: (text: string) => void;
  setInvite: (token: string) => void;
  setAdvisorSetup: (flag: boolean) => void;
  markGuideRead: (key: string) => void;
  setBiz: (biz: string | null) => void;
  setFs: (fs: number) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...defaultState(),
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ ...loadPersisted(BS), hydrated: true });
  },

  setCfg: (patch) => {
    saveCfg(BS, patch);
    set((s) => ({ cfg: { ...s.cfg, ...patch } }));
  },
  setBackground: (bg) => {
    saveBackground(BS, bg);
    set({ background: bg });
  },
  setBgInfo: (info) => {
    saveBgInfo(BS, info);
    set({ bgInfo: info });
  },
  setAnswers: (answers) => {
    saveAnswers(BS, answers);
    set({ answers });
  },
  setAiDiagText: (text) => {
    saveAiDiag(BS, text);
    set({ aiDiagText: text });
  },
  setInvite: (token) => {
    saveInvite(BS, token);
    set({ invite: token });
  },
  setAdvisorSetup: (flag) => {
    saveAdvisorSetup(BS, flag);
    set({ advisorSetup: flag });
  },
  markGuideRead: (key) => {
    const next = { ...get().readGuides, [key]: true };
    saveReadGuides(BS, next);
    set({ readGuides: next });
  },
  setBiz: (biz) => {
    saveBiz(BS, biz);
    set({ biz });
  },
  setFs: (fs) => {
    saveFs(BS, fs);
    set({ fs });
  },
}));
