// app/(home)/page.tsx
import { Suspense } from "react";
import HomeInner from "./HomeInner";
import styles from "./Home.module.css";

export default function HomePage() {
  return (
    <Suspense fallback={<div className={styles.fallback}>読み込み中...</div>}>
      <HomeInner />
    </Suspense>
  );
}
