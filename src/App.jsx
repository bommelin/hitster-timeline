import React, { useEffect, useRef, useState } from 'react';
import ClearCardsDialog from './components/ClearCardsDialog.jsx';
import PlayerNameDialog from './components/PlayerNameDialog.jsx';
import Timeline from './components/Timeline.jsx';
import YearDialog from './components/YearDialog.jsx';
import {
  clearUnsavedCards,
  createCard,
  getLatestSavedRound,
  normalizeCards,
  saveCards,
  sortCards,
  validatePlayerName,
} from './lib/cards.js';

const STORAGE_KEY = 'hitster-timeline-cards-v1';
const PLAYER_NAME_KEY = 'hitster-timeline-player-v1';

function readSavedCards() {
  try {
    const savedCards = localStorage.getItem(STORAGE_KEY);
    return savedCards ? normalizeCards(JSON.parse(savedCards)) : [];
  } catch {
    return [];
  }
}

function readSavedPlayerName() {
  try {
    const result = validatePlayerName(localStorage.getItem(PLAYER_NAME_KEY) ?? '');
    return result.valid ? result.name : '';
  } catch {
    return '';
  }
}

export default function App() {
  const [cards, setCards] = useState(readSavedCards);
  const [playerName, setPlayerName] = useState(readSavedPlayerName);
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [focusCardId, setFocusCardId] = useState(null);
  const nextOrderRef = useRef(
    cards.reduce((highest, card) => Math.max(highest, card.order), 0) + 1,
  );
  const hasBaseCard = cards.some((card) => card.isBase);
  const unsavedCount = cards.filter((card) => !card.saved).length;
  const latestSavedRound = getLatestSavedRound(cards);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch {
      // The app remains usable when storage is unavailable.
    }
  }, [cards]);

  useEffect(() => {
    try {
      if (playerName) {
        localStorage.setItem(PLAYER_NAME_KEY, playerName);
      } else {
        localStorage.removeItem(PLAYER_NAME_KEY);
      }
    } catch {
      // The app remains usable when storage is unavailable.
    }
  }, [playerName]);

  function handleYearSubmit(year, submittedPlayerName = '') {
    const card = createCard(year, {
      isBase: !hasBaseCard,
      order: nextOrderRef.current,
      round: hasBaseCard ? latestSavedRound + 1 : 0,
      saved: !hasBaseCard,
    });
    nextOrderRef.current += 1;

    if (!hasBaseCard && submittedPlayerName) {
      setPlayerName(submittedPlayerName);
    }

    setCards((currentCards) => sortCards([...currentCards, card]));
    setFocusCardId(card.id);
    setYearDialogOpen(false);
  }

  function handleSaveCards() {
    if (unsavedCount === 0) return;
    setCards((currentCards) => saveCards(currentCards));
  }

  function handleClear(removeBase) {
    const remainingCards = removeBase ? [] : clearUnsavedCards(cards);
    setCards(remainingCards);
    setFocusCardId(
      remainingCards.find((card) => card.id === focusCardId)?.id
        ?? remainingCards.find((card) => card.isBase)?.id
        ?? null,
    );
    setClearDialogOpen(false);

    if (removeBase) {
      nextOrderRef.current = 1;
    }
  }

  return (
    <main className={hasBaseCard ? 'app-shell' : 'home'}>
      {hasBaseCard ? (
        <>
          <header className="topbar">
            <h1>Hitster Timeline</h1>
            <div className="topbar__right">
              <p className="credit credit--topbar">Made by Felix Bommelin</p>
              <div className="topbar__actions">
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => setYearDialogOpen(true)}
                >
                  Add card
                </button>
                <button
                  type="button"
                  className="button button--save"
                  disabled={unsavedCount === 0}
                  onClick={handleSaveCards}
                >
                  Save cards
                </button>
                <button
                  type="button"
                  className="button button--quiet"
                  onClick={() => setClearDialogOpen(true)}
                >
                  Clear cards
                </button>
              </div>
            </div>
          </header>

          <Timeline
            cards={cards}
            focusCardId={focusCardId}
            playerName={playerName}
            onChangePlayerName={() => setNameDialogOpen(true)}
          />

          <footer className="counter" aria-live="polite">
            <span>Current cards: <strong>{cards.length}</strong></span>
            <span className="round-status">
              {unsavedCount > 0
                ? `${unsavedCount} unsaved ${unsavedCount === 1 ? 'card' : 'cards'} · Round ${latestSavedRound + 1}`
                : 'All cards saved'}
            </span>
          </footer>
        </>
      ) : (
        <>
          <section className="home__content" aria-labelledby="home-title">
            <h1 id="home-title">Hitster Timeline</h1>
            <p className="home__intro">
              Start with one year, then build your timeline card by card.
            </p>
            <button
              type="button"
              className="button button--primary button--large"
              onClick={() => setYearDialogOpen(true)}
            >
              Create base card
            </button>
          </section>
          <p className="credit credit--home">Made by Felix Bommelin</p>
        </>
      )}

      <YearDialog
        open={yearDialogOpen}
        isBase={!hasBaseCard}
        existingPlayerName={playerName}
        onCancel={() => setYearDialogOpen(false)}
        onSubmit={handleYearSubmit}
      />

      <PlayerNameDialog
        open={nameDialogOpen}
        currentName={playerName}
        onCancel={() => setNameDialogOpen(false)}
        onSubmit={(name) => {
          setPlayerName(name);
          setNameDialogOpen(false);
        }}
      />

      <ClearCardsDialog
        open={clearDialogOpen}
        unsavedCount={unsavedCount}
        onCancel={() => setClearDialogOpen(false)}
        onConfirm={handleClear}
      />
    </main>
  );
}
