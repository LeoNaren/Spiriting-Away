"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReactionButtons from "./Reactions";

function FeedCard({ post, user }) {
  const router = useRouter();
  const [topAnswer, setTopAnswer] = useState(null);

  useEffect(() => {
    async function fetchAnswer() {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/posts/${post.id}/answers`,
        );
        if (response.ok) {
          const fetchedAnswers = await response.json();
          setTopAnswer(fetchedAnswers[0] || null);
        }
      } catch (error) {
        console.error("Error fetching top answer:", error);
      }
    }
    fetchAnswer();
  }, [post.id]);

  return (
    <div
      className="feed-card"
      onClick={() => router.push(`/post/${post.id}`)}
    >
      <h3 className="feed-post">{post.content}</h3>
      {topAnswer && (
        <div className="top-answer">
          <span className="answer-label">Top answer</span>
          <p className="answer-preview">{topAnswer.content}</p>
          <ReactionButtons answer={topAnswer} user={user} />
        </div>
      )}
    </div>
  );
}

function Feed({ user, recentPosts = [] }) {
  const [posts, setposts] = useState([]);
  const [activeTab, setActiveTab] = useState("trending");

  useEffect(() => {
    async function loadposts() {
      try {
        const response = await fetch("http://127.0.0.1:8000/posts");
        if (response.ok) {
          const data = await response.json();
          setposts(data);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    }
    loadposts();
  }, []);

  const sortedposts =
    activeTab === "trending"
      ? [...posts].sort((a, b) => b.answerCount - a.answerCount)
      : [...posts].sort((a, b) => {
          const aTime = Date.parse(a.created_at) || 0;
          const bTime = Date.parse(b.created_at) || 0;
          return bTime - aTime;
        });

  return (
    <div className="feed">
      <div className="feed-header">
        <button
          className={`feed-tab ${activeTab === "trending" ? "active" : ""}`}
          onClick={() => setActiveTab("trending")}
        >
          Trending
        </button>
        <button
          className={`feed-tab ${activeTab === "new" ? "active" : ""}`}
          onClick={() => setActiveTab("new")}
        >
          New
        </button>
        <button
          className={`feed-tab mobile-only ${activeTab === "recent" ? "active" : ""}`}
          onClick={() => setActiveTab("recent")}
        >
          Recent
        </button>
      </div>

      {activeTab === "recent"
        ? recentPosts.map((post) => (
            <FeedCard key={post.id} user={user} post={post} />
          ))
        : sortedposts.map((post) => (
            <FeedCard key={post.id} user={user} post={post} />
          ))}
    </div>
  );
}

export default Feed;
