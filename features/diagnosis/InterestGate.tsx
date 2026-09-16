"use client";
import type { DiagItem } from "@/content/diagnosis-items";
import type { GuideTopic } from "@/content/guide";
import { guideForItem, consultQuestionFor, consultQuestionForTopic } from "@/lib/domain/guide-map";

export type InterestMap = Record<string, "yes" | "no" | undefined>;

// AI診断の各項目直後に差し込む「興味ある？→ 相談/ガイド」。v1 InterestGate を移植。
export function InterestGate({
  it,
  topic,
  interest,
  setInterest,
  hasKey,
  onAsk,
  onGuide,
  track,
}: {
  it?: DiagItem;
  topic?: GuideTopic;
  interest: InterestMap;
  setInterest: (fn: (s: InterestMap) => InterestMap) => void;
  hasKey: boolean;
  onAsk: (question: string) => void;
  onGuide: (guideKey: string) => void;
  track?: (type: string, detail?: string) => void;
}) {
  const ikey = it ? it.k : topic!.key;
  const gkey = it ? guideForItem(it).key : topic!.key;
  const question = it ? consultQuestionFor(it) : consultQuestionForTopic(topic!);
  const st = interest[ikey];

  return (
    <div className="qi">
      {!st && (
        <>
          <div className="qi__q">👉 これ、興味ある？</div>
          <div className="qi__btns">
            <button
              className="qi__yes"
              onClick={() => {
                setInterest((s) => ({ ...s, [ikey]: "yes" }));
                track?.("interest", ikey);
              }}
            >
              🔥 興味ある
            </button>
            <button className="qi__no" onClick={() => setInterest((s) => ({ ...s, [ikey]: "no" }))}>
              😌 一旦保留
            </button>
          </div>
        </>
      )}
      {st === "yes" && (
        <div className="qi__open">
          {hasKey ? (
            <button
              className="qi__yes"
              onClick={() => {
                track?.("consult_jump", ikey);
                onAsk(question);
              }}
            >
              💬 これについて、うちのお店に合わせてAIに相談 ›
            </button>
          ) : (
            <div className="d-note">💡 設定でGeminiキーを入れると、この場でAIに相談できます。</div>
          )}
          <button className="fx-guide" onClick={() => onGuide(gkey)}>
            📚 ガイドで直し方を見る
          </button>
        </div>
      )}
      {st === "no" && (
        <div className="qi__skip">
          😌 一旦保留にしますね。
          <button
            className="qi__reopen"
            onClick={() =>
              setInterest((s) => {
                const n = { ...s };
                delete n[ikey];
                return n;
              })
            }
          >
            やっぱり気になる
          </button>
        </div>
      )}
    </div>
  );
}
