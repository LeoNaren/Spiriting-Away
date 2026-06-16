"use client";
import { act, useRef, useState } from "react";
import { verses, facts, events } from "../data";
import * as Arrows from "@/data/icons";

function getNext(arr, currentID) {
  const next = arr[Math.floor(Math.random() * arr.length)];
  if (next.id === currentID) return getNext(arr, currentID);
  return next;
}

function WisdomDoc() {
  const [activeType, setActiveType] = useState(0);
  const [currentVerse, setCurrentVerse] = useState(verses[0]);
  const [currentFact, setCurrentFact] = useState(facts[0]);
  const [currentEvent, setCurrentEvent] = useState(events[0]);

  const touchStartX = useRef(null);

  const cards = [
    {
      badge: "Verse",
      title: currentVerse.original,
      body: currentVerse.translation,
    },
    {
      badge: currentFact.type,
      title: currentFact.title,
      body: currentFact.body,
    },
    {
      badge: currentEvent.badge,
      title: currentEvent.title,
      body: currentEvent.date,
    },
  ];

  function handleNext() {
    setActiveType((activeType + 1) % 3);
  }

  function handlePrev() {
    setActiveType((activeType - 1 + 3) % 3);
  }

  function handleMore() {
    if (activeType === 0) setCurrentVerse(getNext(verses, currentVerse.id));
    if (activeType === 1) setCurrentFact(getNext(facts, currentFact.id));
    if (activeType === 2) setCurrentEvent(getNext(events, currentEvent.id));
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if(diff > 0) handleNext();
    else handlePrev();
    touchStartX.current = null;
  }

  const card = cards[activeType];

  return (
    <div className="hero-stack">
      <button className="nav-btn-prev nav-btn" onClick={handlePrev}>
        <Arrows.ArrowLeft />
      </button>
      <div className="stack-card" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <span className="card-badge">{card.badge}</span>
        <h3 className="original-verse">{card.title}</h3>
        <p className="translation">{card.body}</p>
      </div>
      <button className="nav-btn-next nav-btn" onClick={handleNext}>
        <Arrows.ArrowRight />
      </button>
      <button className="nav-btn-more nav-btn" onClick={handleMore}>
        <Arrows.ArrowDown />
      </button>

      <div className="hero-dots">
        {cards.map((_, i) => (
          <span key={i} className={`hero-dot ${i === activeType ? "active" : ""}`} />
        ))}
      </div>
    </div>
  );
}

export default WisdomDoc;
