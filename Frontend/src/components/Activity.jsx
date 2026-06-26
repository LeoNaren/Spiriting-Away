"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import "@/styles/activity.css";

async function fetchActivity(getToken) {
  const token = await getToken();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/activity?limit=5`,
    { method: "GET",
      headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error("Failed to fetch activity");
  return res.json();
}

export default function Activity() {
  const { user, getToken } = useAuth();
  const { data } = useQuery({
    queryKey: ["activity", user?.uid],
    queryFn: () => fetchActivity(getToken),
    enabled: !!user,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

  const activities = data?.posts || [];

  return (
    <div className="activity-wrapper">
      <p className="activity-header">Activity</p>
      {!user ? null : activities.length === 0 ? (
        <p className="activity-empty">No recent activity yet.</p>
      ) : null}
      {activities.map((item) => (
        <div key={item.id} className="activity-item">
          <div className="activity-item-content">
            <p className="activity-item-title">{item.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}