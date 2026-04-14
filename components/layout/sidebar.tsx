// components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { Home, CalendarCheck2 } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";

type SidebarProps = {
  active: "home" | "meeting";
};

function navButtonStyle(active: boolean) {
  return {
    display: "flex",
    alignItems: "center" as const,
    gap: 8,
    width: "100%",
    minHeight: 46,
    padding: "8px 10px",
    borderRadius: 14,
    border: active ? "1px solid #d9e2ff" : "1px solid transparent",
    background: active ? "#eef2ff" : "transparent",
    color: active ? "#334155" : "#6b7280",
    textDecoration: "none",
    fontSize: 12,
    fontWeight: 600,
    boxSizing: "border-box" as const,
    lineHeight: 1.2,
  };
}

export default function Sidebar({ active }: SidebarProps) {
  const { data: session } = useSession();
  const displayName = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <aside
      style={{
        width: 128,
        background: "#f8fafc",
        borderRight: "1px solid #e5e7eb",
        padding: "10px 6px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: "100vh",
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      <nav style={{ display: "grid", gap: 6, marginTop: 6 }}>
        <Link href="/" style={navButtonStyle(active === "home")}>
          <Home size={18} strokeWidth={1.9} />
          <span>Home</span>
        </Link>

        <Link href="/meeting" style={navButtonStyle(active === "meeting")}>
          <CalendarCheck2 size={18} strokeWidth={1.9} />
          <span>Meeting</span>
        </Link>
      </nav>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 999,
            background: "#2f2f34",
            color: "#ffffff",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: 14,
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          {displayName ? displayName.charAt(0).toUpperCase() : "?"}
        </div>

        {displayName && (
          <div
            style={{
              fontSize: 11,
              color: "#64748b",
              fontWeight: 600,
              textAlign: "center",
              lineHeight: 1.3,
              wordBreak: "break-all",
              width: "100%",
              padding: "0 4px",
            }}
          >
            {displayName}
          </div>
        )}

        {session ? (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "http://localhost:3001/" })}
            style={{
              width: "100%",
              height: 32,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#64748b",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              boxSizing: "border-box",
            }}
          >
            サインアウト
          </button>
        ) : (
          <button
            type="button"
            onClick={() => signIn("microsoft-entra-id")}
            style={{
              width: "100%",
              height: 32,
              borderRadius: 10,
              border: "1px solid #c7d6ff",
              background: "#eef2ff",
              color: "#4338ca",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              boxSizing: "border-box",
            }}
          >
            ログイン
          </button>
        )}
      </div>
    </aside>
  );
}