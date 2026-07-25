import React, { useEffect, useMemo, useRef, useState } from 'react';

const CARDS_PER_PAGE = 15;

function getGridSize(cardCount) {
  if (cardCount <= 4) return 'small';
  if (cardCount <= 9) return 'medium';
  return 'large';
}

export default function OverviewDialog({
  open,
  cards,
  onCancel,
  onSelectCard,
}) {
  const dialogRef = useRef(null);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(cards.length / CARDS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const visibleCards = useMemo(() => (
    cards.slice(
      safePage * CARDS_PER_PAGE,
      (safePage + 1) * CARDS_PER_PAGE,
    )
  ), [cards, safePage]);
  const mobileColumns = visibleCards.length <= 1
    ? 1
    : visibleCards.length <= 4
      ? 2
      : 3;
  const desktopColumns = visibleCards.length <= 3
    ? visibleCards.length
    : visibleCards.length <= 8
      ? 4
      : 5;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open && !dialog.open) {
      setPage(0);
      dialog.showModal();
      requestAnimationFrame(() => dialog.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return undefined;
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog overview-dialog"
      tabIndex="-1"
      aria-labelledby="overview-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <section className="dialog__content overview-dialog__content">
        <div className="overview-dialog__heading">
          <h2 id="overview-dialog-title">All cards</h2>
          <p>
            {cards.length} {cards.length === 1 ? 'card' : 'cards'} · earliest to latest
          </p>
        </div>

        <ol
          className={`overview-grid overview-grid--${getGridSize(visibleCards.length)}`}
          style={{
            '--overview-columns': mobileColumns,
            '--overview-desktop-columns': desktopColumns,
          }}
          aria-label={`Cards ${safePage * CARDS_PER_PAGE + 1} to ${safePage * CARDS_PER_PAGE + visibleCards.length}`}
        >
          {visibleCards.map((card) => (
            <li key={card.id}>
              <button
                type="button"
                className="overview-card"
                aria-label={`Jump to ${card.year}${card.isBase ? ', base card' : ''}`}
                onClick={() => onSelectCard(card.id)}
              >
                {card.isBase ? (
                  <span className="overview-card__tag overview-card__tag--base">
                    Base
                  </span>
                ) : card.saveMethod === 'instant' ? (
                  <span className="overview-card__tag overview-card__tag--locked">
                    Locked
                  </span>
                ) : card.saved ? (
                  <span className="overview-card__tag overview-card__tag--saved">
                    Saved
                  </span>
                ) : null}
                <span className="overview-card__year">{card.year}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="overview-dialog__footer">
          {pageCount > 1 ? (
            <div className="overview-pagination" aria-label="Overview pages">
              <button
                type="button"
                className="icon-button"
                aria-label="Previous cards"
                disabled={safePage === 0}
                onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
              >
                ←
              </button>
              <span>{safePage + 1} / {pageCount}</span>
              <button
                type="button"
                className="icon-button"
                aria-label="Next cards"
                disabled={safePage === pageCount - 1}
                onClick={() => setPage((currentPage) => (
                  Math.min(pageCount - 1, currentPage + 1)
                ))}
              >
                →
              </button>
            </div>
          ) : (
            <span aria-hidden="true" />
          )}

          <button
            type="button"
            className="button button--primary"
            onClick={onCancel}
          >
            Close
          </button>
        </div>
      </section>
    </dialog>
  );
}
