import React, { useEffect, useRef, useState } from 'react';

export default function Timeline({
  cards,
  focusCardId,
  playerName,
  onChangePlayerName,
}) {
  const timelineRef = useRef(null);
  const frameRef = useRef(null);
  const [activeId, setActiveId] = useState(cards[0]?.id ?? null);

  function getCardElements() {
    return timelineRef.current
      ? Array.from(timelineRef.current.querySelectorAll('[data-card-id]'))
      : [];
  }

  function centerCard(element, behavior = 'smooth') {
    const timeline = timelineRef.current;
    if (!timeline || !element) return;

    const left = element.offsetLeft - (timeline.clientWidth - element.offsetWidth) / 2;
    timeline.scrollTo({ left, behavior });
  }

  function updateActiveCard() {
    const timeline = timelineRef.current;
    const elements = getCardElements();
    if (!timeline || elements.length === 0) return;

    const timelineBox = timeline.getBoundingClientRect();
    const center = timelineBox.left + timelineBox.width / 2;
    const nearest = elements.reduce((closest, element) => {
      const box = element.getBoundingClientRect();
      const distance = Math.abs(box.left + box.width / 2 - center);
      return distance < closest.distance ? { element, distance } : closest;
    }, { element: elements[0], distance: Number.POSITIVE_INFINITY });

    setActiveId(nearest.element.dataset.cardId);
  }

  function handleScroll() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(updateActiveCard);
  }

  function handleCardKeyDown(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    const elements = getCardElements();
    const currentIndex = elements.indexOf(event.currentTarget);
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = elements[currentIndex + direction];

    if (next) {
      next.focus();
      centerCard(next);
    }
  }

  useEffect(() => {
    if (!focusCardId) return;

    const element = getCardElements().find(
      (cardElement) => cardElement.dataset.cardId === focusCardId,
    );

    if (element) {
      setActiveId(focusCardId);
      requestAnimationFrame(() => centerCard(element));
    }
  }, [focusCardId, cards]);

  useEffect(() => {
    if (!cards.some((card) => card.id === activeId)) {
      setActiveId(cards[0]?.id ?? null);
    }
  }, [cards, activeId]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <section className="timeline-section" aria-labelledby="timeline-heading">
      <div className="timeline-heading-row">
        <div className="timeline-title-block">
          <h2 id="timeline-heading">{playerName || 'Player'}'s Timeline</h2>
          <button
            type="button"
            className="name-change-button"
            onClick={onChangePlayerName}
          >
            Change player name
          </button>
        </div>
        <span className="swipe-hint" aria-hidden="true">Swipe to explore</span>
      </div>

      <div
        ref={timelineRef}
        className="timeline"
        role="list"
        aria-label="Year cards in chronological order"
        onScroll={handleScroll}
      >
        <div className="timeline__track">
          {cards.map((card) => {
            const isActive = card.id === activeId;

            return (
              <article
                key={card.id}
                className={`year-card${card.isBase ? ' year-card--base' : ''}${isActive ? ' year-card--active' : ''}`}
                data-card-id={card.id}
                role="listitem"
                tabIndex="0"
                aria-label={`${card.year}${card.isBase ? ', base card' : card.saved ? ', saved card' : ', unsaved card'}`}
                onFocus={(event) => {
                  setActiveId(card.id);
                  centerCard(event.currentTarget);
                }}
                onKeyDown={handleCardKeyDown}
              >
                {card.isBase ? (
                  <span className="year-card__label year-card__label--base">
                    Base
                  </span>
                ) : card.saved ? (
                  <span className="year-card__label year-card__label--saved">
                    Saved
                  </span>
                ) : null}
                <span className="year-card__year">{card.year}</span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
