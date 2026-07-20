import React, { useEffect, useRef } from 'react';

export default function NewGameDialog({ open, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => cancelButtonRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return undefined;
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="new-game-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <form
        className="dialog__content"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <div>
          <p className="eyebrow">New game</p>
          <h2 id="new-game-dialog-title">Start over?</h2>
          <p className="dialog__description">
            Every card, including the base card and all saved rounds, will be
            removed. Your player name will be kept.
          </p>
        </div>

        <div className="dialog__actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="button button--quiet"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button type="submit" className="button button--danger">
            New game
          </button>
        </div>
      </form>
    </dialog>
  );
}
