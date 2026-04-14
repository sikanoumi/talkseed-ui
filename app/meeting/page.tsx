// app/meeting/page.tsx
import { Suspense } from "react";
import MeetingInner from "./MeetingInner";
import styles from "./meeting.module.css";

export default function MeetingPage() {
  return (
    <Suspense fallback={<div className={styles.fallback}>読み込み中...</div>}>
      <MeetingInner />
    </Suspense>
  );
}
