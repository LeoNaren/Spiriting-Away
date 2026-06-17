"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";


function AskQuestion() {
  const { user, getToken } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSticky, setSticky] = useState(false);
  const askRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setSticky(!entry.isIntersecting);
      },
      { threshold: [0] },
    );
    if (askRef.current) observer.observe(askRef.current);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/posts`, {
        method: "POST",
        headers: {Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content,
        }),
      });

      if (response.ok) {
        setContent("");
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
  }

  return (
    <>
      <div ref={askRef} style={{ height: "1px", marginBottom: "-1px" }} />
      <form className={`question-section ${isSticky ? "stuck" : "original"}`}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ask a question..."
            rows={3}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting || !content.trim()}
            onClick={handleSubmit} // Need to update so that it refereshes the right feed to show the new question
            >
            {isSubmitting ? "Posting..." : "Submit"}
          </button>
      </form>
    </>
  );
}

export default AskQuestion;