"use client";
import "@/styles/reactions.css";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext.jsx";
import { AppreciateIcon, RespondIcon } from "./icons.jsx";
import { Bookmark } from "lucide-react";

// FOLLOW BUTTON COMPONENT
function FollowButton({ post_id }) {
  const { isLoading, user, getToken } = useAuth();
  const queryClient = useQueryClient();
  const authScope = user?.uid ?? "anon";

  const { data: followData, isPending: isLoadingStatus } = useQuery({
    queryKey: ["post", post_id, "following", authScope],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/posts/${post_id}/follow_status`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (!res.ok) throw new Error("Failed to fetch follow status");
      return res.json();
    },
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/posts/${post_id}/follow`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) throw new Error("Failed to toggle follow");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", post_id] });
    },
  });

  const following = followData?.following || false;

  return (
    <div className="follow-button">

      <Bookmark
        className={`follow-btn ${following ? "active" : ""}`}
        size={16}
        onClick={() => toggleFollow.mutate()}
        style={{
          opacity: toggleFollow.isPending || isLoadingStatus ? 0.5 : 1,
          cursor: "pointer",
          color: "var(--primary-color)", // Optional: Highlight when active
        }}
      />
    </div>
  );
}

// REACTION BUTTONS COMPONENT
function ReactionButtons({ post_id = null, response_id = null }) {
  const [hidden, setHidden] = useState(true);
  const [content, setContent] = useState("");
  const { isLoading, getToken, user } = useAuth();

  if (!!post_id === !!response_id) {
    throw new Error("Exactly one of post_id or response_id must be provided");
  }

  const queryClient = useQueryClient();
  const target =
    post_id !== null ? `posts/${post_id}` : `responses/${response_id}`;
  const authScope = user?.uid ?? "anon";

  const queryKey =
    post_id !== null ? ["post", post_id] : ["response", response_id];

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  // GET APPRECIATES
  const getAppreciate = useQuery({
    queryKey: [...queryKey, "appreciate", authScope],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/${target}/appreciate`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch appreciate");
      return res.json();
    },
  });

  // RESPOND BUTTON MUTATION
  const respondClick = useMutation({
    mutationFn: async (content) => {
      if (content.trim() === "") {
        throw new Error("Response content cannot be empty");
      }
      const token = await getToken();
      if (!token) throw new Error("User not authenticated");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/${target}/responses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        },
      );
      if (!response.ok) throw new Error("Failed to submit response");
      return response.json();
    },
    onSuccess: () => {
      setContent(""); // Clear input on success
      setHidden(true); // Hide form on success
      invalidate();
    },
  });

  // APPRECIATE BUTTON MUTATION
  const appreciateClick = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("User not authenticated");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/${target}/appreciate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) throw new Error("Failed to toggle appreciate");
      return res.json();
    },
    onSuccess: invalidate,
  });

  return (
    <div className="reaction-wrapper">
      <div className="InteractionButtons">
        <div className="interaction-left">
          <div className="appreciate-count">
            <button
              onClick={() => {
                if (!user || isLoading) return;
                appreciateClick.mutate();
              }}
              disabled={appreciateClick.isPending || isLoading || !user}
              className="interaction-icon"
            >
              <AppreciateIcon
                className={`reaction-btn ${getAppreciate.data?.appreciated ? "active" : ""}`}
              />
            </button>
            <span>{getAppreciate.data?.count || 0}</span>
          </div>

          <button
            className="interaction-icon"
            onClick={() => setHidden(!hidden)}
          >
            <RespondIcon className="reaction-btn" />
          </button>
        </div>
      </div>

      {!hidden && (
        <form
          className="response-form"
          onSubmit={(e) => {
            e.preventDefault();
            respondClick.mutate(content);
          }}
        >
          <textarea
            placeholder="Share your reflection..."
            className="form-input"
            onChange={(e) => setContent(e.target.value)}
            value={content}
          />

          <div className="response-actions">
            <button
              type="submit"
              disabled={respondClick.isPending || !content.trim()}
              className="btn-primary"
            >
              {respondClick.isPending ? "Submitting..." : "Respond"}
            </button>

            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setHidden(true);
                setContent("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ReactionButtons;
export { FollowButton };
