"use client";
import React, { useState } from "react";

import WisdomDoc from "../components/HeroStack";
import AskQuestion from "../components/Question";
import Feed from "../components/Feed";
import RecentlyAsked from "../components/RecentlyAsked";

function Home() {
  const [posts, setPosts] = useState([]);

  function handleNewQuestion(newPost) {
    setPosts((prev) => [newPost, ...prev]);
    console.log(newPost);
  }

  return (
    <>
      <div className="page-body">
        <div>
          <WisdomDoc />
          <AskQuestion newQuestion={handleNewQuestion} />
          <Feed recentPosts={posts} />
        </div>
        <aside className="side-column">
          <RecentlyAsked questions={posts} />
        </aside>
      </div>
    </>
  );
}

export default Home;
