"use client";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import ReactionButtons, { FollowButton } from "@/components/Reactions";
import { formatDistanceToNow } from "date-fns";

export default function DiscussionPage() {
  const queryClient = useQueryClient();
  const { id } = useParams();
  
  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/post/${id}`,
      );
      if (!res.ok) {
        throw new Error("Failed to fetch post");
      }
      return res.json();
    },
    initialData: () => queryClient.getQueryData(["post", id]),
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error occurred while fetching post</div>;


  return (
    <section className="title-container">
      <div className="title">{post.content}</div>
      <div className="meta-data">
        <p className="question-meta">
            Asked by {post.author.name ? post.author.name : "Loading..."} •{" "}
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
            })}
          </p>

          <div className="question-actions">
            <ReactionButtons post_id={post.id} />
            <FollowButton post_id={post.id} />
          </div>
      </div>
    </section>
  );
}
