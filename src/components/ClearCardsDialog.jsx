import React, { useEffect, useRef, useState } from 'react';

export default function ClearCardsDialog({ open, unsavedCount, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const [removeBase, setRemoveBase] = useState(false);
  const [confirmingFullGame, setConfirmingFullGame] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open && !dialog.open) {
      setRemoveBase(false);
      setConfirmingFullGame(false);
      dialog.showModal();
      requestAnimationFrame(() => cancelButtonRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return undefined;
  }, [open]);

  function handleSubmit(event) {
    event.preventDefault();

    if (removeBase && !confirmingFullGame) {
      setConfirmingFullGame(true);
      requestAnimationFrame(() => cancelButtonRef.current?.focus());
      return;
    }

    onConfirm(removeBase);
  }

  function returnToFirstStep() {
    setConfirmingFullGame(false);
    requestAnimationFrame(() => cancelButtonRef.current?.focus());
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="clear-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (confirmingFullGame) {
          returnToFirstStep();
        } else {
          onCancel();
        }
      }}
    >
      <form className="dialog__content" onSubmit={handleSubmit}>
        {confirmingFullGame ? (
          <div>
            <p className="eyebrow">Final confirmation</p>
            <h2 id="clear-dialog-title">Clear the full game?</h2>
            <p className="dialog__description">
              This removes the base card and every saved and unsaved card. This
              action cannot be undone. Your player name will remain saved.
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="eyebrow">Unsaved round</p>
              <h2 id="clear-dialog-title">Clear unsaved cards?</h2>
              <p className="dialog__description">
                {unsavedCount > 0
                  ? `${unsavedCount} ${unsavedCount === 1 ? 'card' : 'cards'} added since your last save will be removed. Saved cards will stay safe.`
                  : 'There are no unsaved cards. Your saved cards will stay safe.'}
              </p>
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={removeBase}
                onChange={(event) => setRemoveBase(event.target.checked)}
              />
              <span>
                Also remove the base card
                <small>This removes every card and returns to the start screen.</small>
              </span>
            </label>
          </>
        )}

        <div className="dialog__actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="button button--quiet"
            onClick={confirmingFullGame ? returnToFirstStep : onCancel}
          >
            {confirmingFullGame ? 'Go back' : 'Cancel'}
          </button>
          <button type="submit" className="button button--danger">
            {confirmingFullGame
              ? 'Yes, clear full game'
              : removeBase
                ? 'Clear full game'
                : 'Clear cards'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
