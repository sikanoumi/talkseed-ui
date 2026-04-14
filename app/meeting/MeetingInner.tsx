// app/meeting/MeetingInner.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/layout/sidebar";
import styles from "./meeting.module.css";

const initialNews = [
  "営業部で来期目標の見直しが進行中",
  "部内の案件負荷見直しに向けたヒアリングを今月実施予定",
  "マネージャー向け1on1運用ガイドの更新案が共有された",
];

const topics = [
  "最近の会社生活における悩みについて",
  "来期の目標設定について",
  "今後のキャリアの方向性について",
];

const topicAccents = [
  { bg: "#EEF2FF", color: "#4F46E5", label: "Topic 01" },
  { bg: "#ECFEFF", color: "#0891B2", label: "Topic 02" },
  { bg: "#ECFDF5", color: "#059669", label: "Topic 03" },
];


const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

// prettier-ignore
const AI_SUMMARY_PLACEHOLDER = "ここにAI要約が表示されます。会議終了後に要点、合意事項、次回の話題候補をまとめます。";

type DraftData = {
  sharedMemo: string;
  privateMemo: string;
  summary: string;
};

export default function MeetingInner() {
  const { data: session } = useSession();
  const ownerUserId = session?.user?.oid ?? null;

  const searchParams = useSearchParams();
  const personId = searchParams.get("person_id") ?? "unknown";
  const meetingId = `meeting-${personId}`;
  const draftKey = `meeting_draft_${personId}`;

  const personMap: Record<string, { name: string; role: string; avatar: string }> = {
    p1: { name: "山田 太郎", role: "営業部 / マネージャー", avatar: "山" },
    p2: { name: "佐藤 花子", role: "開発部 / メンバー", avatar: "佐" },
    p3: { name: "鈴木 一郎", role: "人事部 / リーダー", avatar: "鈴" },
  };
  const currentPerson = personMap[personId] ?? { name: personId, role: "", avatar: personId.charAt(0) };

  const captureRef = useRef<HTMLDivElement>(null);

  const handleExportPdf = async () => {
    if (!captureRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(captureRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width * ratio, canvas.height * ratio);
    pdf.save(`${meetingId}-capture.pdf`);
  };

  const [sharedMemo, setSharedMemo] = useState("");
  const [privateMemo, setPrivateMemo] = useState("");
  const [summary, setSummary] = useState(AI_SUMMARY_PLACEHOLDER);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // 初回マウント時: localStorage 優先 → なければ API から取得
  useEffect(() => {
    const raw = window.localStorage.getItem(draftKey);

    if (raw) {
      // --- localStorage に下書きがある場合はそちらを優先 ---
      try {
        const draft: DraftData = JSON.parse(raw);
        if (draft.sharedMemo !== undefined) setSharedMemo(draft.sharedMemo);
        if (draft.privateMemo !== undefined) setPrivateMemo(draft.privateMemo);
        if (draft.summary !== undefined) setSummary(draft.summary);
        setSaveMessage("下書きを復元しました");
        setTimeout(() => setSaveMessage(""), 3000);
      } catch {
        // 壊れたデータは無視する
      }
      return;
    }

    // --- localStorage が無い場合は API から取得 ---
    const loadFromApi = async () => {
      console.log("loading meeting from api");
      try {
        const url = ownerUserId
          ? `${API}/meetings/${meetingId}?owner_user_id=${encodeURIComponent(ownerUserId)}`
          : `${API}/meetings/${meetingId}`;
        const response = await fetch(url);

        if (response.status === 404) {
          console.log("meeting load skipped: not found");
          return;
        }

        if (!response.ok) {
          throw new Error(`Unexpected status: ${response.status}`);
        }

        const data = await response.json();
        console.log("meeting loaded", data);
        if (data.shared_memo !== undefined) setSharedMemo(data.shared_memo);
        if (data.private_memo !== undefined) setPrivateMemo(data.private_memo);
        if (data.summary !== undefined) setSummary(data.summary);
      } catch (error) {
        console.error("meeting load error", error);
      }
    };

    loadFromApi();
  }, [personId, ownerUserId]);

  const handleDraftSave = () => {
    try {
      const draft: DraftData = { sharedMemo, privateMemo, summary };
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
      setSaveMessage("下書きを保存しました");
    } catch {
      setSaveMessage("保存に失敗しました");
    } finally {
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const handleFinishMeeting = async () => {
    if (!ownerUserId) {
      setSaveMessage("ログインが必要です");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }
    console.log("finish button clicked");
    setIsSaving(true);
    try {
      const payload = {
        owner_user_id: ownerUserId,
        shared_memo: sharedMemo,
        private_memo: privateMemo,
        summary,
      };
      console.log("about to fetch");
      const response = await fetch(`${API}/meetings/${meetingId}/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log("response status", response.status);

      if (!response.ok) {
        throw new Error(`Failed to finish meeting: ${response.status}`);
      }

      await response.json();
      window.localStorage.removeItem(draftKey);
      setSaveMessage("ミーティング内容を保存しました");
      setTimeout(() => setSaveMessage(""), 4000);
    } catch (error) {
      console.error("finish error", error);
      setSaveMessage("保存に失敗しました");
      setTimeout(() => setSaveMessage(""), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className={styles.pageRoot}>
      <div className={styles.layout}>
        <Sidebar active="meeting" />

        <div className={styles.content}>
          <div className={styles.stack} ref={captureRef}>

            {/* ヘッダー */}
            <section className={styles.headerCard}>
              <div className={styles.headerGrid}>
                <div className={styles.avatarCell}>
                  <div className={styles.avatar}>{currentPerson.avatar}</div>
                  <div>
                    <div className={styles.avatarName}>{currentPerson.name}</div>
                    <div className={styles.avatarMeta}>{currentPerson.role}</div>
                  </div>
                </div>

                <div className={styles.meetingTimeBox}>
                  <div className={styles.meetingTimeLabel}>ミーティング日時</div>
                  <div className={styles.meetingTimeValue}>2026/03/11 14:00 - 14:30</div>
                </div>

                <div className={styles.statusBadge}>進行中</div>
              </div>
            </section>

            {/* 上段：今日のお題 + 関連ニュース */}
            <section className={styles.topRow}>
              <div className={styles.topicsCard}>
                <div className={styles.sectionTitle}>今日のお題</div>
                <div className={styles.sectionSubtitle}>
                  今回の1on1で触れておきたいテーマです。
                </div>

                <div className={styles.topicsGrid}>
                  {topics.map((topic, idx) => {
                    const accent = topicAccents[idx] ?? topicAccents[0];
                    return (
                      <div key={topic} className={styles.topicCard}>
                        <span
                          className={styles.topicBadge}
                          style={{ background: accent.bg, color: accent.color }}
                        >
                          {accent.label}
                        </span>
                        <div className={styles.topicText}>{topic}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.newsCard}>
                <div className={styles.sectionTitle}>関連ニュース</div>
                <div className={styles.sectionSubtitle}>
                  会話の背景として見ておけるトピックです。
                </div>

                <div className={styles.newsList}>
                  {initialNews.map((news) => (
                    <div key={news} className={styles.newsItem}>
                      <div className={styles.newsItemInner}>
                        <div className={styles.newsBullet} />
                        <div>{news}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 下段：個人メモ + 共有メモ + AI要約 */}
            <section className={styles.bottomRow}>
              <div className={styles.memoCard}>
                <div className={styles.sectionTitle}>個人メモ</div>
                <div className={styles.sectionSubtitle}>自分だけが見られるメモです。</div>
                <textarea
                  className={styles.textarea}
                  value={privateMemo}
                  onChange={(e) => setPrivateMemo(e.target.value)}
                  placeholder="自分だけが見られるメモ"
                  rows={10}
                />
              </div>

              <div className={styles.memoCard}>
                <div className={styles.sharedMemoHeader}>
                  <div>
                    <div className={styles.sectionTitleLg}>共有メモ</div>
                    <div className={styles.sectionSubtitle}>編集中 — 会議終了時に正式保存されます</div>
                  </div>
                  <div className={styles.syncBadge}>編集中</div>
                </div>
                <textarea
                  className={styles.textarea}
                  value={sharedMemo}
                  onChange={(e) => setSharedMemo(e.target.value)}
                  placeholder="ここに双方の共有メモが入る"
                  rows={10}
                />
              </div>

              <div className={styles.memoCard}>
                <div className={styles.sectionTitle}>AI要約</div>
                <div className={styles.sectionSubtitle}>
                  AIの下書きを必要に応じて編集できます。
                </div>
                <textarea
                  className={styles.textareaSummary}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={10}
                />
              </div>
            </section>

            {/* フッター操作 */}
            <section className={styles.footerCard}>
              <div className={styles.footerInner}>
                <div className={styles.footerLeft}>
                  <span className={styles.footerBadgeRecord}>1on1記録</span>
                  <span className={styles.footerBadgeSave}>会議終了時に正式保存</span>
                  {saveMessage && (
                    <span style={{ fontSize: 13, color: "#64748b" }}>{saveMessage}</span>
                  )}
                </div>
                <div className={styles.footerRight}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleExportPdf}
                  >
                    PDF出力
                  </button>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleDraftSave}
                    disabled={isSaving}
                  >
                    下書き保存
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleFinishMeeting}
                    disabled={isSaving}
                  >
                    ミーティング終了
                  </button>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
