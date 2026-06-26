"use client";
import "@/styles/askQuestions.css";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

function AskQuestion({ onSuccess }) {
  const { user, getToken } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSticky, setSticky] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isAbove = entry.boundingClientRect.top < 0;
        setSticky(!entry.isIntersecting && isAbove);
      },
      { threshold: [0.3] },
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (content.trim() === "") return;
    if (!user) {
      alert("Please sign in to ask questions");
    }
    setIsSubmitting(true);

    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/posts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content,
          }),
        },
      );

      if (response.ok) {
        setContent("");
        onSuccess?.();
      } else {
        const errorData = await response.json();
        console.error("Backend Error:", errorData);
        throw new Error("Request failed");
      }
    } catch (err) {
      console.error("Network error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div ref={sentinelRef} style={{ height: "1px", visibility: "hidden" }} />
      <section className={`ask-container ${isSticky ? "ask-scrolled" : ""}`}>
        <form className="ask-form">
          <input
            className="ask-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Introspection is the Answer"
            disabled={isSubmitting}
          />
          <div className="ask-actions">
            <button
              type="submit"
              className={`submit-button ${isSticky ? "submit-button--scrolled" : ""}`}
              disabled={isSubmitting || !content.trim()}
              onClick={handleSubmit}
            >
              <span className="submit-text">
                {isSubmitting ? "Posting..." : "Ask"}
              </span>
              <span className="submit-icon">↑</span>
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export default AskQuestion;
