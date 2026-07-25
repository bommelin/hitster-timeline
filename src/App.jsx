import React, { useEffect, useRef, useState } from 'react';
import CardDialog from './components/CardDialog.jsx';
import ChipCounter from './components/ChipCounter.jsx';
import ClearCardsDialog from './components/ClearCardsDialog.jsx';
import HelpDialog from './components/HelpDialog.jsx';
import HistoryDialog from './components/HistoryDialog.jsx';
import PlayerNameDialog from './components/PlayerNameDialog.jsx';
import Timeline from './components/Timeline.jsx';
import YearDialog from './components/YearDialog.jsx';
import {
  changeCardYear,
  clearUnsavedCards,
  createCard,
  deleteCard,
  getLatestSavedRound,
  instaLockCard,
  normalizeCards,
  normalizeSaveHistory,
  normalizeTokenCount,
  removeCardFromHistory,
  saveCardBatch,
  sortCards,
  undoSaveEvent,
  validatePlayerName,
} from './lib/cards.js';

const STORAGE_KEY = 'hitster-timeline-cards-v1';
const PLAYER_NAME_KEY = 'hitster-timeline-player-v1';
const HISTORY_KEY = 'hitster-timeline-history-v1';
const TOKEN_KEY = 'hitster-timeline-tokens-v1';

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

function readSavedHistory(cards) {
  try {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    return savedHistory
      ? normalizeSaveHistory(JSON.parse(savedHistory), cards)
      : [];
  } catch {
    return [];
  }
}

function readSavedTokenCount() {
  try {
    return normalizeTokenCount(localStorage.getItem(TOKEN_KEY));
  } catch {
    return 0;
  }
}

export default function App() {
  const [cards, setCards] = useState(readSavedCards);
  const [playerName, setPlayerName] = useState(readSavedPlayerName);
  const [saveHistory, setSaveHistory] = useState(() => readSavedHistory(cards));
  const [tokenCount, setTokenCount] = useState(readSavedTokenCount);
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [focusCardId, setFocusCardId] = useState(null);
  const nextOrderRef = useRef(
    cards.reduce((highest, card) => Math.max(highest, card.order), 0) + 1,
  );
  const hasBaseCard = cards.some((card) => card.isBase);
  const unsavedCount = cards.filter((card) => !card.saved).length;
  const latestSavedRound = getLatestSavedRound(cards);
  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? null;

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

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(saveHistory));
    } catch {
      // The app remains usable when storage is unavailable.
    }
  }, [saveHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(TOKEN_KEY, String(tokenCount));
    } catch {
      // The app remains usable when storage is unavailable.
    }
  }, [tokenCount]);

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

    const result = saveCardBatch(cards);
    if (!result.event) return;

    setCards(result.cards);
    setSaveHistory((currentHistory) => [result.event, ...currentHistory]);
  }

  function handleCardYearChange(cardId, year) {
    setCards((currentCards) => changeCardYear(currentCards, cardId, year));
    setFocusCardId(cardId);
    setSelectedCardId(null);
  }

  function handleDeleteCard(cardId) {
    const currentIndex = cards.findIndex((card) => card.id === cardId);
    const remainingCards = deleteCard(cards, cardId);
    if (remainingCards.length === cards.length) return;

    const nextFocusedCard =
      remainingCards[Math.min(currentIndex, remainingCards.length - 1)]
      ?? remainingCards.find((card) => card.isBase)
      ?? null;

    setCards(remainingCards);
    setSaveHistory((currentHistory) => (
      removeCardFromHistory(currentHistory, cardId)
    ));
    setFocusCardId(nextFocusedCard?.id ?? null);
    setSelectedCardId(null);
  }

  function handleInstaLock(cardId) {
    const result = instaLockCard(cards, cardId);
    if (!result.event) return;

    setCards(result.cards);
    setSaveHistory((currentHistory) => [result.event, ...currentHistory]);
    setFocusCardId(cardId);
    setSelectedCardId(null);
  }

  function undoHistoryEvent(eventId) {
    setCards((currentCards) => undoSaveEvent(currentCards, eventId));
    setSaveHistory((currentHistory) => (
      currentHistory.filter((event) => event.id !== eventId)
    ));
  }

  function handleUndoInstaLock(eventId) {
    undoHistoryEvent(eventId);
    setSelectedCardId(null);
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
      setSaveHistory([]);
      setTokenCount(0);
    }
  }

  return (
    <main className={hasBaseCard ? 'app-shell' : 'home'}>
      {hasBaseCard ? (
        <>
          <header className="topbar">
            <div className="topbar__title">
              <h1>Hitster Timeline</h1>
              <button
                type="button"
                className="help-button"
                aria-label="How to use Hitster Timeline"
                title="How it works"
                onClick={() => setHelpDialogOpen(true)}
              >
                ?
              </button>
            </div>
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
            onEditCard={(card) => setSelectedCardId(card.id)}
          />

          <footer className="game-footer">
            <div className="game-footer__tools">
              <span aria-hidden="true" />
              <ChipCounter
                count={tokenCount}
                onAdd={() => setTokenCount((count) => Math.min(99, count + 1))}
                onRemove={() => setTokenCount((count) => Math.max(0, count - 1))}
              />
              <button
                type="button"
                className="icon-button history-button"
                aria-label="Round history"
                title="Round history"
                onClick={() => setHistoryDialogOpen(true)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4.8 7.8H1.9V4.9" />
                  <path d="M3.2 7.2A9 9 0 1 1 3 16.5" />
                  <path d="M12 7.2V12l3.2 2" />
                </svg>
              </button>
            </div>

            <div className="counter" aria-live="polite">
              <span>Current cards: <strong>{cards.length}</strong></span>
              <span className="round-status">
                {unsavedCount > 0
                  ? `${unsavedCount} unsaved ${unsavedCount === 1 ? 'card' : 'cards'} · Round ${latestSavedRound + 1}`
                  : 'All cards saved'}
              </span>
            </div>
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

      <CardDialog
        open={Boolean(selectedCard)}
        card={selectedCard}
        onCancel={() => setSelectedCardId(null)}
        onDelete={handleDeleteCard}
        onInstaLock={handleInstaLock}
        onSaveYear={handleCardYearChange}
        onUndoInstaLock={handleUndoInstaLock}
      />

      <HistoryDialog
        open={historyDialogOpen}
        events={saveHistory}
        cards={cards}
        onCancel={() => setHistoryDialogOpen(false)}
        onUndo={undoHistoryEvent}
      />

      <HelpDialog
        open={helpDialogOpen}
        onCancel={() => setHelpDialogOpen(false)}
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
