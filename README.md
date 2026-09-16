# マップ集客ラボ V3

営業がGBP状況を5項目で入力 → AIがサイテーションを精査 → 固有URL＋QRを発行 → オーナー様が「AIの読み解き」として総合点＋項目別スコアを受け取る、教育型リード資産（カンリー）。

- 起点: `maplab_v2`（features/design/lib のレイヤー構成）
- 実装計画: [`plan.md`](./plan.md)
- 承認デザインモック(v6.1): https://claude.ai/code/artifact/02b8f7ee-5e9f-4749-a3e1-b93a410d85e7

## 開発

```bash
npm install
npm run dev        # http://localhost:3000
npm run test       # vitest（採点エンジン等）
npm run typecheck
```

環境変数は `.env.example` を参照（Redis / Gemini）。
