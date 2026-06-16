"use client";
import { useState, useEffect } from "react";
import { listenToQuestions } from "../data/firestore";
import { useRouter } from "next/navigation";

function RecentlyAskedCard({ q }) {
  const router = useRouter();
  return (
    <div className="recently-asked-card" onClick={() => router.push(`/question/${q.id}`)}>
      <h3 className="recently-asked-question">{q.text}</h3>
      <div className="recently-asked-meta">
        <span className="asked-time">
          {q.askedAt?.toDate?.().toLocaleString() || "Just now"}
        </span>
        {q.isAnswered ? (
          <span className="answered-label">Answered</span>
        ) : (
          <span className="unanswered-label">Unanswered</span>
        )}
      </div>
    </div>
  );
}

function RecentlyAsked() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const unsubscribe = listenToQuestions((allQuestions) => {
      const now = new Date();
      const filtered = allQuestions
        .filter((q) => {
          const askedAt = q.askedAt?.toDate?.();
          if (!askedAt) return true;
          const hoursAgo = (now - askedAt) / (100 * 60 * 60);
          return hoursAgo <= 24 || !q.isAnswered;
        })
        .slice(0, 5);
      setQuestions(filtered);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="recently-asked">
      <h2 className="section-title">Recently Asked</h2>
      {questions.length === 0 ? (
        <p style={{ fontSize: "13px", color: "#999" }}>
          No recent questions yet.
        </p>
      ) : (
        questions.map((q) => <RecentlyAskedCard key={q.id} q={q} />)
      )}
    </div>
  );
}

export default RecentlyAsked;
