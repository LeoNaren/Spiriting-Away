"use client";
import "@/styles/layout.css";
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import WisdomDoc from "../components/HeroStack";
import AskQuestion from "../components/Question";
import Feed from "../components/Feed_new";
import RecentlyAsked from "../components/RecentlyAsked";

function Home() {
  const queryClient = useQueryClient();

  return (
    <>
      <div className="page-body">
        <div className="main-column">
          <section className="wisdom-container">
            <WisdomDoc />
          </section>
          
          <section className="ask-container">
            <AskQuestion onSuccess={() =>
              queryClient.invalidateQueries({
                queryKey: ["posts"],
              })
            } />
          </section>

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
