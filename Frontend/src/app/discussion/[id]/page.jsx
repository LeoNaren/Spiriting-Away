"use client";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useRef } from "react";
import { useEffect, useState } from "react";
import "@/styles/discussionPage.css";

import ReactionButtons, { FollowButton } from "@/components/Reactions";
import { formatDistanceToNow } from "date-fns";

const limit = 20;

// POST FETCH
async function fetchResponses(post_id, skip = 0) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/posts/${post_id}/responses?skip=${skip}`,
  );
  if (!res.ok) {
    throw new Error("Failed to fetch responses");
  }
  return res.json();
}

function ResponseCard({ response, onClick }) {
  if (!response) return <Skeleton count={5} />;
  return (
    <div className="response-card" onClick={onClick}>
      <div className="response-meta">
        <p>
          {response.author.username ? response.author.username : "Loading..."}
        </p>
        <p>
          Last updated{" "}
          {formatDistanceToNow(new Date(response.updated_at), {
            addSuffix: true,
          })}
        </p>
      </div>
      <div className="response-content line-clamp-3">{response.content}</div>
      <ReactionButtons response_id={response.id} />
    </div>
  );
}

function ResponseFull({ response }) {
  if (!response) return <Skeleton />;
  const { content, created_at, updated_at, author } = response;
  const username = author.username;

  return (
    <div className="response-full">
      <div className="response-meta">
        <p>Author: {username}</p>
        {/* <p>
          Created at:{" "}
          {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
        </p> */}
        <p>
          Last updated:{" "}
          {formatDistanceToNow(new Date(updated_at), { addSuffix: true })}
        </p>
      </div>
      <hr />
      <p>{content}</p>
      <ReactionButtons response_id={response.id} />
    </div>
  );
}

export default function DiscussionPage() {
  const [containerRes, setContainerRes] = useState([]);
  const sentinelRef = useRef(null);
  const skipRef = useRef(0);
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [selectedId, setSelectedId] = useState(null);

  // Fetch post data
  const {
    data: post,
    isLoading: postLoading,
    isError: postError,
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

  // Fetch responses data
  const {
    data: responses,
    isLoading: responsesLoading,
    isError: responsesError,
  } = useQuery({
    queryKey: ["responses", id],
    queryFn: () => fetchResponses(id, 0),
    enabled: !!id,
    initialData: () => queryClient.getQueryData(["responses", id]),
  });

  // Infinite scrolling logic
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // reset pagination when responses or id change
    skipRef.current = 0;
    setContainerRes([]);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          !responsesLoading &&
          !responsesError &&
          Array.isArray(responses)
        ) {
          const start = skipRef.current;
          const next = responses.slice(start, start + limit);
          if (next.length) {
            setContainerRes((prev) => [...prev, ...next]);
            skipRef.current += limit;
          }
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [responses, responsesLoading, responsesError]);

  // Left-column scroll
  const scrollTimeoutRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const handleScroll = () => {
    setIsScrolling(true);
    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 800);
  };

  return (
    <>
      <section className="title-container">
        {postLoading ? (
          <Skeleton count={1} height={30} />
        ) : postError ? (
          <div>Error occurred while fetching the post</div>
        ) : (
          <>
            <div className="meta-data">
              <p className="question-meta">
                Author: {" "}
                {post.author.username ? post.author.username : "Loading..."} • {" "}
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}
              </p>
              <div className="title">{post.content}</div>
            </div>
            <div className="question-actions">
              <ReactionButtons className="post-reaction" post_id={post.id} />
              <FollowButton post_id={post.id} />
            </div>
          </>
        )}
      </section>

      <div className="discussion-body">
        <section
          className={`left-column ${isScrolling ? "is-scrolling" : ""}`}
          onScroll={handleScroll}
        >
          <div className="responses-container">
            {responsesLoading ? (
              <Skeleton count={3} />
            ) : responsesError ? (
              <div>Error occurred while fetching responses</div>
            ) : containerRes && containerRes.length ? (
              containerRes.map((response) => (
                <ResponseCard
                  key={response.id}
                  response={response}
                  onClick={() => setSelectedId(response.id)}
                />
              ))
            ) : (
              <div>No responses yet</div>
            )}
            <div ref={sentinelRef} className="scroll-sentinel">
              End of responses
            </div>
          </div>
        </section>

        <section className="right-column">
          <ResponseFull
            response={
              containerRes.find((res) => res.id === selectedId) ??
              containerRes[0]
            }
          />
        </section>
      </div>
    </>
  );
}
