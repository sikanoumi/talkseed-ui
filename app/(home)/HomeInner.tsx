// app/(home)/HomeInner.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/layout/sidebar";
import styles from "./Home.module.css";

type Person = {
  id: string;
  name: string;
  role: string;
  topics: string[];
  nextMeeting?: string;
};

type ApiMeeting = {
  id: number;
  meeting_id: string;
  owner_user_id: string;
  shared_memo: string;
  private_memo: string;
  summary: string;
  created_at: string;
  updated_at: string;
};

const initialPeople: Person[] = [
  {
    id: "p1",
    name: "山田 太郎",
    role: "営業部 / マネージャー",
    topics: ["来期の目標設定", "現在の案件負荷について"],
    nextMeeting: "2026-03-18 10:00",
  },
  {
    id: "p2",
    name: "佐藤 花子",
    role: "開発部 / メンバー",
    topics: ["最近の業務の進め方", "学習したい技術について"],
    nextMeeting: "2026-03-19 14:00",
  },
  {
    id: "p3",
    name: "鈴木 一郎",
    role: "人事部 / リーダー",
    topics: ["オンボーディング改善", "組織連携について"],
    nextMeeting: "2026-03-21 16:00",
  },
];

const defaultSuggestions = [
  "最近の会社生活における悩みについて",
  "今後のキャリアの方向性について",
  "来期に向けた目標と不安について",
];

function meetingIdToPersonName(meetingId: string): string {
  const personId = meetingId.replace(/^meeting-/, "");
  return initialPeople.find((p) => p.id === personId)?.name ?? meetingId;
}

function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "/");
}

const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

const card: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5eaf3",
  borderRadius: 24,
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
};

export default function HomeInner() {
  const { data: session } = useSession();
  const ownerUserId = session?.user?.oid ?? null;
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [selectedPersonId, setSelectedPersonId] = useState(initialPeople[0].id);
  const [topicInput, setTopicInput] = useState("");
  const [pastMeetings, setPastMeetings] = useState<ApiMeeting[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>(defaultSuggestions);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState("");

  const fetchSuggestions = async (person: Person, seedText = "") => {
    setIsLoadingAi(true);
    setAiError("");
    try {
      const res = await fetch(`${API}/ai/topic-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: person.id,
          person_name: person.name,
          person_role: person.role,
          seed_text: seedText,
          owner_user_id: ownerUserId ?? "",
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data: { suggestions: string[] } = await res.json();
      setAiSuggestions(data.suggestions);
    } catch (e) {
      console.error("ai suggestions error", e);
      setAiError("話題の取得に失敗しました");
    } finally {
      setIsLoadingAi(false);
    }
  };

  useEffect(() => {
    if (!ownerUserId) return;
    const load = async () => {
      try {
        const res = await fetch(
          `${API}/meetings?owner_user_id=${encodeURIComponent(ownerUserId)}`
        );
        if (!res.ok) return;
        const raw = await res.json();
        const records: ApiMeeting[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.records)
          ? raw.records
          : [];
        setPastMeetings(records);
      } catch (e) {
        console.error("past meetings load error", e);
      }
    };
    load();
  }, [ownerUserId]);

  useEffect(() => {
    const person = people.find((p) => p.id === selectedPersonId);
    if (person) fetchSuggestions(person);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersonId]);

  const handleOpenMeeting = () => {
    router.push(`/meeting?person_id=${selectedPersonId}`);
  };

  const handleSuggestionClick = (text: string) => {
    setTopicInput(text);
  };

  const handleRegister = () => {
    const value = topicInput.trim();
    if (!value) return;

    setPeople((prev) =>
      prev.map((person) =>
        person.id === selectedPersonId
          ? { ...person, topics: [...person.topics, value] }
          : person
      )
    );

    setTopicInput("");
  };

  return (
    <main className={styles.pageRoot}>
      <div className={styles.layout}>
        <Sidebar active="home" />

        <div className={styles.content}>
          <div className={styles.stack}>

            {/* DEBUG: session 確認 — 確認後に削除 */}
            <div
              style={{
                gridColumn: "1 / -1",
                background: "#fefce8",
                border: "1px solid #fde047",
                borderRadius: 12,
                padding: "12px 16px",
                fontSize: 12,
                color: "#713f12",
                fontFamily: "monospace",
                lineHeight: 1.8,
              }}
            >
              <strong>[DEBUG] session</strong>
              <div>name: {session?.user?.name ?? "(なし)"}</div>
              <div>email: {session?.user?.email ?? "(なし)"}</div>
              <div>oid: {session?.user?.oid ?? "(なし)"}</div>
            </div>

            {/* トピック登録カード — 全幅 */}
            <div style={{ ...card, padding: 24, gridColumn: "1 / -1" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "260px minmax(0, 1fr) 120px",
                  gap: 16,
                  alignItems: "start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#64748b",
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    誰と話すか
                  </div>

                  <select
                    value={selectedPersonId}
                    onChange={(e) => setSelectedPersonId(e.target.value)}
                    style={{
                      width: "100%",
                      height: 48,
                      borderRadius: 14,
                      border: "1px solid #d7dde8",
                      background: "#fff",
                      padding: "0 14px",
                      fontSize: 14,
                      color: "#0f172a",
                    }}
                  >
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name} / {person.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#64748b",
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    どんな話をする？
                  </div>

                  <textarea
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="話したい内容を入力"
                    rows={3}
                    style={{
                      width: "100%",
                      borderRadius: 16,
                      border: "1px solid #d7dde8",
                      padding: 14,
                      fontSize: 14,
                      resize: "vertical",
                      background: "#fff",
                      boxSizing: "border-box",
                      color: "#0f172a",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div style={{ paddingTop: 25 }}>
                  <button
                    type="button"
                    onClick={handleRegister}
                    style={{
                      width: "100%",
                      height: 48,
                      borderRadius: 999,
                      border: "none",
                      background: "#0f172a",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 900,
                      cursor: "pointer",
                      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.2)",
                    }}
                  >
                    登録
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                    AI提案
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const person = people.find((p) => p.id === selectedPersonId);
                      if (person) fetchSuggestions(person, topicInput);
                    }}
                    disabled={isLoadingAi}
                    style={{
                      height: 30,
                      padding: "0 14px",
                      borderRadius: 999,
                      border: "1px solid #d7dde8",
                      background: "#ffffff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: isLoadingAi ? "default" : "pointer",
                      color: "#334155",
                    }}
                  >
                    {isLoadingAi ? "生成中..." : "話題生成"}
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: aiError ? "#ef4444" : "#64748b",
                    marginBottom: 12,
                    lineHeight: 1.6,
                  }}
                >
                  {aiError || "会話のきっかけになりそうなテーマです。"}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  {aiSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      style={{
                        minHeight: 84,
                        textAlign: "left",
                        borderRadius: 18,
                        border: "1px solid #edf1f6",
                        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                        padding: "14px 14px 16px",
                        fontSize: 14,
                        fontWeight: 700,
                        lineHeight: 1.7,
                        cursor: "pointer",
                        color: "#1f2937",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          height: 28,
                          padding: "0 12px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 900,
                          background: "#EEF2FF",
                          color: "#4F46E5",
                          width: "fit-content",
                        }}
                      >
                        AI提案 {String(idx + 1).padStart(2, "0")}
                      </span>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 相手一覧カード */}
            <div style={{ ...card, padding: 24 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 6,
                }}
              >
                相手一覧
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  marginBottom: 16,
                  lineHeight: 1.6,
                }}
              >
                1on1 の相手を選んで話題を管理します。
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 16,
                }}
              >
                {people.map((person) => {
                  const active = person.id === selectedPersonId;

                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setSelectedPersonId(person.id)}
                      style={{
                        textAlign: "left",
                        background: active
                          ? "linear-gradient(180deg, #f5f8ff 0%, #eef3ff 100%)"
                          : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                        border: active
                          ? "1px solid #c7d6ff"
                          : "1px solid #edf1f6",
                        borderRadius: 22,
                        padding: 18,
                        cursor: "pointer",
                        boxShadow: active
                          ? "0 4px 16px rgba(79, 70, 229, 0.08)"
                          : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "56px minmax(0, 1fr)",
                          gap: 14,
                          alignItems: "start",
                        }}
                      >
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            background:
                              "linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 18,
                            fontWeight: 900,
                            color: "#4338ca",
                          }}
                        >
                          {person.name.charAt(0)}
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: 17,
                              fontWeight: 900,
                              color: "#0f172a",
                              marginBottom: 4,
                            }}
                          >
                            {person.name}
                          </div>

                          <div
                            style={{
                              fontSize: 13,
                              color: "#64748b",
                              marginBottom: 14,
                            }}
                          >
                            {person.role}
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gap: 8,
                              marginBottom: 14,
                            }}
                          >
                            {person.topics.map((topic, idx) => (
                              <div
                                key={idx}
                                style={{
                                  borderRadius: 12,
                                  background: "#f8fafc",
                                  border: "1px solid #eef2f7",
                                  padding: "10px 12px",
                                  fontSize: 13,
                                  color: "#334155",
                                  lineHeight: 1.7,
                                }}
                              >
                                {topic}
                              </div>
                            ))}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                color: "#64748b",
                              }}
                            >
                              次回予定: {person.nextMeeting ?? "-"}
                            </div>

                            <div style={{ display: "flex", gap: 8 }}>
                              <div
                                style={{
                                  height: 34,
                                  padding: "0 14px",
                                  borderRadius: 999,
                                  background: "#eef2ff",
                                  color: "#4338ca",
                                  fontSize: 12,
                                  fontWeight: 900,
                                  display: "grid",
                                  placeItems: "center",
                                }}
                              >
                                日程確認
                              </div>
                              {active && (
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenMeeting();
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.stopPropagation();
                                      handleOpenMeeting();
                                    }
                                  }}
                                  style={{
                                    height: 34,
                                    padding: "0 14px",
                                    borderRadius: 999,
                                    border: "none",
                                    background: "#0f172a",
                                    color: "#ffffff",
                                    fontSize: 12,
                                    fontWeight: 900,
                                    cursor: "pointer",
                                    display: "grid",
                                    placeItems: "center",
                                  }}
                                >
                                  1on1を開く
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 過去のミーティングカード */}
            <div style={{ ...card, padding: 24 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 6,
                }}
              >
                過去のミーティング
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  marginBottom: 16,
                  lineHeight: 1.6,
                }}
              >
                これまでの記録を確認できます。
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {pastMeetings.length === 0 && (
                  <div style={{ fontSize: 13, color: "#94a3b8", padding: "8px 0" }}>
                    {ownerUserId ? "記録はまだありません" : "ログインすると記録が表示されます"}
                  </div>
                )}
                {pastMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    style={{
                      border: "1px solid #eef2f7",
                      borderRadius: 18,
                      padding: 14,
                      background: "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        marginBottom: 6,
                      }}
                    >
                      {formatDate(meeting.created_at)}
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 900,
                        color: "#0f172a",
                        marginBottom: 4,
                      }}
                    >
                      {meetingIdToPersonName(meeting.meeting_id)}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#475569",
                        marginBottom: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      {meeting.summary ? meeting.summary.slice(0, 60) + (meeting.summary.length > 60 ? "…" : "") : "（要約なし）"}
                    </div>

                    <button
                      type="button"
                      onClick={() => alert("次はPDF表示につなぐ")}
                      style={{
                        height: 34,
                        padding: "0 14px",
                        borderRadius: 999,
                        border: "1px solid #d7dde8",
                        background: "#ffffff",
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: "pointer",
                        color: "#1f2937",
                      }}
                    >
                      PDFを見る
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
