"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReactionButtons from "./Reactions";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

function FeedCard({ post }) {
  const router = useRouter();
  const [topResponse, setTopResponse] = useState(null);
  const { user, getToken } = useAuth();

  useEffect(() => {
    async function fetchResponse() {
      console.log(process.env.NEXT_PUBLIC_BACKEND_URL)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/posts/${post.id}/responses`,
        );
        if (response.ok) {
          const fetchedResponses = await response.json();
          setTopResponse(fetchedResponses[0] || null);
        }
      } catch (error) {
        console.error("Error fetching top response:", error);
      }
    }
    fetchResponse();
  }, [post.id]);

  return (
    <div className="feed-card">
      <div className="card-top">
        <div className="avatar">
          {}
        </div>
      </div>
      <h3 className="feed-post"
      onClick={() => router.push(`/post/${post.id}`)}>
        {post.content}
      </h3>
      <ReactionButtons post_id={post.id} />
      {topResponse && (
        <div className="top-answer">
          <span className="answer-label">Top response</span>
          <p className="answer-preview">{topResponse.content}</p>
          <ReactionButtons response_id={topResponse.id} />
        </div>
      )}
    </div>
  );
}

function Feed({ recentPosts = [] }) {
  const [posts, setposts] = useState([]);
  const [activeTab, setActiveTab] = useState("trending");

  useEffect(() => {
    async function loadposts() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/posts`);
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
      ? [...posts].sort((a, b) => b.responseCount - a.responseCount)
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
            <FeedCard key={post.id} post={post} />
          ))
        : sortedposts.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
    </div>
  );
}

export default Feed;
