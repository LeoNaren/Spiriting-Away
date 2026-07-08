"use client";
import "@/styles/feed.css";
import ReactionButtons, { FollowButton } from "./Reactions";
import { useState, useEffect, useRef, useCallback } from "react";
import { formatDistanceToNow, set } from "date-fns";
import { UserProf } from "./icons.jsx";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

function FeedCard({ post }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    // Fetch user
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user?user_id=${post.user_id}`)
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error("Error fetching user:", err));

    // Fetch responses
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/posts/${post.id}/${3}/responses`)
      .then((res) => res.json())
      .then((data) => setResponses(data))
      .catch((err) => console.error("Error fetching responses:", err));
  }, [post.id, post.user_id]);

  const queryClient = useQueryClient();
  queryClient.setQueryData(["post", post.id], post);
  queryClient.setQueryData(["user", post.user_id], user);


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
          <h3 className="question-title" onClick={() => router.push(`/discussion/${post.id}`)}>
            {post.content}
          </h3>

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
  const LIMIT =10;
  

export default function Feed() {
  const [sort, setSort] = useState("trending");
  const [posts, setPosts] = useState([]);
  const [skip, setSkip] = useState(0);
  const hasMoreRef = useRef(true);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);
  const isFetchingRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadPosts = useCallback(async (skip) => {
    if (isFetchingRef.current || !hasMoreRef.current) return;
    isFetchingRef.current = true;
    const currentRequestId = ++requestIdRef.current;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/feed-posts?skip=${skip}&limit=${LIMIT}&sort=${sort}`,
      );
      const data = await response.json();

      if (currentRequestId !== requestIdRef.current) return;

      setPosts((prev) => [...prev, ...data]);
      if (data.length < LIMIT) {
        hasMoreRef.current = false;
        setHasMore(false);
      }

      setSkip((prev) => prev + data.length);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [sort]);

  const handleSortChange = (newSort) => {
    if (newSort === sort) return;
    requestIdRef.current++;
    setSort(newSort);
    console.log('Sort changed to:', newSort);
    setPosts([]);
    setSkip(0);
    hasMoreRef.current = true;
    setHasMore(true);
    isFetchingRef.current = false;
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPosts(0);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadPosts]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadPosts(skip);
      },
      { threshold: 0.3 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [skip, loadPosts]);

  return (
    <div>
      <div className="sort-btns">
        <button className={`sort-btn ${sort === "trending" ? "active" : ""}`} onClick={() => handleSortChange("trending")}>
          Trending
        </button>
        <button className={`sort-btn ${sort === "new" ? "active" : ""}`} onClick={() => handleSortChange("new")}>
          New
        </button>
      </div>
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} />
      ))}
      <div className="sentinel"ref={sentinelRef}>{hasMore ? "Loading more posts..." : "End of feed"}</div>
    </div>
  );
}
