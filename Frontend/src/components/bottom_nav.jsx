"use client";
import "@/styles/layout.css";
import { Activity, Compass, RefreshCcwDot} from "lucide-react";

export default function BottomNav(props) {
  return (
    <div className="bottom-nav">
      <button
        id="left-column-toggle"
        onClick={() => props.toggler("left-column")}
      >
        <Activity />
      </button>
      <button
        id="main-column-toggle"
        onClick={() => props.toggler("main-column")}
      >
        <Compass />
      </button>
      <button
        id="right-column-toggle"
        onClick={() => props.toggler("right-column")}
      >
        <RefreshCcwDot />
      </button>
    </div>
  );
}
