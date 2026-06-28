"use client";
import "@/styles/layout.css";
import {React, useState} from "react";
import { useQueryClient } from "@tanstack/react-query";

import WisdomDoc from "../components/HeroStack";
import AskQuestion from "../components/Question";
import Feed from "../components/Feed_new";
import RecentlyAsked from "../components/RecentlyAsked";
import Activity from "../components/Activity";
import BottomNav from "../components/bottom_nav";

function Home() {
  const queryClient = useQueryClient();
  const [activeColumn, setActiveColumn] = useState("main-column");

  return (
    <>
      <div className="page-body">
        <div className={`left-column ${activeColumn === "left-column" ? "active" : ""}`}>
          <Activity />
        </div>
        <div className={`main-column ${activeColumn === "main-column" ? "active" : ""}`}>
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
        <aside className={`right-column ${activeColumn === "right-column" ? "active" : ""}`}>
          <RecentlyAsked />
        </aside>

        <BottomNav className="bottom-nav" toggler={ (x) => setActiveColumn(x) } />
      </div>
    </>
  );
}

export default Home;
