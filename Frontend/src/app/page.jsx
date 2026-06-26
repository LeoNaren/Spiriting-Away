"use client";
import "@/styles/layout.css";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";

import WisdomDoc from "../components/HeroStack";
import AskQuestion from "../components/Question";
import Feed from "../components/Feed_new";
import RecentlyAsked from "../components/RecentlyAsked";
import Activity from "../components/Activity";

function Home() {
  const queryClient = useQueryClient();

  return (
    <>
      <div className="page-body">
        <div className="left-column">
          <Activity />
        </div>
        <div className="main-column">
          <section className="wisdom-container">
            <WisdomDoc />
          </section>

          <AskQuestion
            onSuccess={() =>
              queryClient.invalidateQueries({
                queryKey: ["posts"],
              })
            }
          />

          <section className="feed-container">
            <Feed />
          </section>
        </div>
        <aside className="side-column">
          <RecentlyAsked />
        </aside>
      </div>
    </>
  );
}

export default Home;
