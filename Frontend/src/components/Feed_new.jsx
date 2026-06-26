"use client";
import "@/styles/feed.css";
import ReactionButtons, { FollowButton } from "./Reactions";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {UserProf} from "./icons.jsx";

function FeedCard({ post }) {
  const [user, setUser] = useState(null);
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    // Fetch user
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user?user_id=${post.user_id}`)
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error("Error fetching user:", err));

    // Fetch responses
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/posts/${post.id}/responses`)
      .then((res) => res.json())
      .then((data) => setResponses(data))
      .catch((err) => console.error("Error fetching responses:", err));
  }, [post.id, post.user_id]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="feed-card">
      <div className="card-top avatar-side">
        <div className="avatar">
          <UserProf />
        </div>
      </div>

      <div className="data-side">
        <div className="question-content">
          <h3 className="question-title">{post.content}</h3>

          <p className="question-meta">
            Asked by {user.name} •{" "}
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
            })}
          </p>

          <div className="question-actions">
            <ReactionButtons post_id={post.id} />
            <FollowButton post_id={post.id} />
          </div>
        </div>
        {responses.length > 0 && (
          <>
            <div className="card-divider">
              <div className="top-reflection">Top Response</div>
              <p className="reflection-content">{responses[0].content}</p>
              <div className="reflection-actions">
                <ReactionButtons response_id={responses[0].id} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/posts?sort=new&skip=0&limit=20`,
        );
        const data = await res.json();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    }
    loadPosts();
  }, []);

  return (
    <div>
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} />
      ))}
    </div>
  );
}
