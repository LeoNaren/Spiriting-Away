"use client";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { AppreciateIcon, Feather } from "./icons.jsx";

// RESPOND BUTTON FUNCTION
function ReactionButtons({ post_id = null, response_id = null }) {
  const [hidden, setHidden] = useState(true);
  const [content, setContent] = useState("");
  const { getToken } = useAuth();

  if (!!post_id === !!response_id) {
    throw new Error("Exactly one of post_id or response_id must be provided");
  }

  const queryClient = useQueryClient();
  const target =
    post_id !== null ? `posts/${post_id}` : `responses/${response_id}`;
  const queryKey =
    post_id !== null ? ["post", post_id] : ["response", response_id];

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  //GET APPRECIATES
  const getAppreciate = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/${target}/appreciate`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getToken()}`,
          },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch appreciate");
      return res.json();
    },
  });

  // RESPONSE BUTTON FUNCTION
  const respondClick = useMutation({
    mutationFn: async (content) => {
      if (content.trim() === "") {
        throw new Error("Response content cannot be empty");
      }

      const token = await getToken();
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
    onSuccess: invalidate,
  });

  // APPRECIATE BUTTON FUNCTION
  const appreciateClick = useMutation({
    mutationFn: async () => {
      const token = await getToken();
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

  // SHARE FUNCTION GOES HERE

  // SAVE FUNCTION GOES HERE

  return (
    <div className="InteractionButtons">
      {/* RESPONSE BUTTON */}
      <div className="response-button">
        {hidden ? (
          <button className="btn-outline" onClick={() => setHidden(false)}>
            Respond
          </button>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              respondClick.mutate(content);
            }}
          >
            <textarea
              placeholder="Write your response..."
              className="form-input"
              onChange={(e) => setContent(e.target.value)}
              value={content}
            ></textarea>
            <button
              type="submit"
              disabled={respondClick.isPending}
              className="btn-primary"
            >
              {respondClick.isPending ? "Submitting..." : "Respond"}
            </button>
            <button className="btn-outline" onClick={() => setHidden(true)}>
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* APPRECIATE BUTTON */}
      <div className="appreciate-count">
        <button
          onClick={() => appreciateClick.mutate()}
          disabled={appreciateClick.isPending}
        >
          {<AppreciateIcon className="w-4 h-4" />}
        </button>
        <span>{getAppreciate.data?.count || 0}</span>
      </div>
    </div>
  );
}

export default ReactionButtons;
