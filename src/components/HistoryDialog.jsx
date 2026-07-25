import React, { useEffect, useRef } from 'react';

function formatSavedTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function HistoryDialog({
  open,
  events,
  cards,
  onCancel,
  onUndo,
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const cardsById = new Map(cards.map((card) => [card.id, card]));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return undefined;
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="history-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <section className="dialog__content">
        <div>
          <p className="eyebrow">Saved actions</p>
          <h2 id="history-dialog-title">Round history</h2>
          <p className="dialog__description">
            Undoing an entry makes only those cards unsaved again.
          </p>
        </div>

        {events.length > 0 ? (
          <ol className="history-list">
            {events.map((event) => {
              const years = event.cardIds
                .map((cardId) => cardsById.get(cardId)?.year)
                .filter(Boolean);

              return (
                <li key={event.id} className="history-item">
                  <div>
                    <strong>
                      {event.type === 'instant'
                        ? 'Insta-lock'
                        : `Round ${event.round} saved`}
                    </strong>
                    <span className="history-item__meta">
                      {formatSavedTime(event.savedAt)}
                    </span>
                    <span className="history-item__years">
                      {years.join(', ')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="button button--quiet history-item__undo"
                    onClick={() => onUndo(event.id)}
                  >
                    Undo
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="history-empty">No saved rounds or insta-locks yet.</p>
        )}

        <div className="dialog__actions">
          <button
            ref={closeButtonRef}
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
