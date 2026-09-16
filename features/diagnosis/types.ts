// AI系APIに渡す資格情報（自前キー or 招待トークン ＋ 表現設定）
export interface AiCreds {
  key?: string;
  invite?: string;
  model: string;
  dialect: string;
  tone: string;
}
