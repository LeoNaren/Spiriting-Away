"use client";
import "@/styles/recentlyAsked.css";
import ReactionButtons, { FollowButton } from "./Reactions";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";

async function fetchPosts() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/feed-posts?sort=new&skip=0&limit=7`
  );
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

async function fetchUser(userId) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user?user_id=${userId}`
  );
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

function RecentCard({ post }) {
  const { data: user } = useQuery({
    queryKey: ["user", post.user_id],
    queryFn: () => fetchUser(post.user_id),
    staleTime: 5 * 60 * 1000, // user data doesn't change often
  });

  if (!user) return <div>Loading...</div>;

  return (
    <div className="recent-card">
      <div className="recent-card-content">
        <h3 className="recent-card-title">{post.content}</h3>
        <p className="recent-card-meta">
          Asked by {user.name} •{" "}
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </p>
      </div>
      <div className="recent-card-actions">
        <ReactionButtons post_id={post.id} />
        <FollowButton post_id={post.id} />
      </div>
    </div>
  );
}

export default function RecentlyAsked() {
  const { data: posts = [] } = useQuery({
    queryKey: ["posts", "recent"],
    queryFn: fetchPosts,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false, // pauses when tab is not active
  });

  return (
    <div className="recently-asked-wrapper">
      <p className="recently-asked-header">Recently Asked</p>
      {posts.map((post) => (
        <RecentCard key={post.id} post={post} />
      ))}
    </div>
  );
}