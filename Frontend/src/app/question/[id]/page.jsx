"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../data/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext"
import { getAnswersForQuestion, addAnswer } from "../../../data/firestore";
import ReactionButtons from "../../../components/Reactions";
import "./discussionPage.css";

function DiscussionPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const questionSnap = await getDoc(doc(db, "questions", id));
      if (questionSnap.exists()) {
        setQuestion({ id: questionSnap.id, ...questionSnap.data() });
      }
      console.log("fetch quesiton:", questionSnap.data())
      const fetchedAnswers = await getAnswersForQuestion(id);
      setAnswers(fetchedAnswers);
    }
    fetchData();
  }, [id]);

  function sortAnswers(answers) {
    function getPriority(answer) {
      if (answer.isTopAnswer) return 0;
      if (answer.likeCount > 0) return 1;
      return 2;
    }

    return [...answers].sort((a, b) => {
      const priorityDiff = getPriority(a) - getPriority(b);
      if (priorityDiff !== 0) return priorityDiff;
      if (getPriority(a) === 1) return b.likeCount - a.likeCount;
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }

  async function handleSubmitAnswer() {
    if (newAnswer.trim() === "") return;
    if (!user) return;
    setSubmitting(true);
    await addAnswer(id, newAnswer, user);
    setNewAswer("");
    const updated = await getAnswersForQuestion(id);
    setAnswers(updated);
    setSubmitting(false);
  }

  async function handleMarkTopAnswer(answerId) {
    if (!question || user?.uid !== question.userId) return;
    const { updateDoc, doc: firestoreDoc } = await import("firebase/firestore");
    await updateDoc(firestoreDoc(db, "answers", answerId), {
      isTopAnswer: true,
    });
    const updated = await getAnswersForQuestion(id);
    setAnswers(updated);
  }

  if (!question) return <p style={{ padding: "2rem" }}>Loading...</p>;

  return (
    <div className="discussion-page">
      <div className="discussion-question">
        <span className="qtag">{question.tag}</span>
        <h1 className="discussion-title">{question.text}</h1>
        <p className="discussion-meta">
          Asked by {question.userName || "Anonymous"} <br />{" "}
          {question.askedAt?.toDate().toLocaleDateString()}
        </p>
      </div>

      <div className="discussion-answers">
        <h2 className="answers-title">
          {answers.length} {answers.length === 1 ? "answer" : "answers"}
        </h2>

        {answers.length === 0 && <p className="no-answers">No answers yet.</p>}

        {sortAnswers(answers).map((answer) => (
          <div
            key={answer.id}
            className={`answer-card ${answer.isTopAnswer ? "top-answer-card" : ""}`}
          >
            {answer.isTopAnswer && (
              <span className="top-answer-badge">✓ Marked as helpful</span>
            )}
            <p className="answer-text">{answer.text}</p>
            <div className="answer-footer">
              <span
                className="answer-meta"
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <span>{answer.userName}</span>
                <span>{answer.createdAt.toDate().toLocaleDateString()}</span>
              </span>
              <div className="answer-actions">
                <ReactionButtons answer={answer} user={user} />
                {user &&
                  user.uid === question.userId &&
                  !answer.isTopAnswer && (
                    <button
                      className="mark-helpful-btn"
                      onClick={() => handleMarkTopAnswer(answer.id)}
                    >
                      Mark as helpful
                    </button>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="submit-answer">
        <h2 className="submit-title">Share your thoughts</h2>
        {user ? (
          <>
            <textarea
              className="answer-input"
              placeholder="Share your opinion..."
              value={newAnswer}
              onChange={(e) => setNewAswer(e.target.value)}
              rows={5}
            />
            <button
              className="submit-btn"
              onClick={handleSubmitAnswer}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit answer"}
            </button>
          </>
        ) : (
          <p className="sign-in-prompt">
            <a href="/auth">Sign in</a> to share your experience.
          </p>
        )}
      </div>
    </div>
  );
}

export default DiscussionPage;
