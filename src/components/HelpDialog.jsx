import React, { useEffect, useRef } from 'react';

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15.2 5.2 3.6 3.6M4.8 19.2l4.1-.9 9.3-9.3a1.8 1.8 0 0 0 0-2.5l-.7-.7a1.8 1.8 0 0 0-2.5 0l-9.3 9.3-.9 4.1Z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.8 7.8H1.9V4.9" />
      <path d="M3.2 7.2A9 9 0 1 1 3 16.5" />
      <path d="M12 7.2V12l3.2 2" />
    </svg>
  );
}

function HelpItem({ visual, title, children }) {
  return (
    <li className="help-item">
      <span className="help-item__visual" aria-hidden="true">{visual}</span>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </li>
  );
}

export default function HelpDialog({ open, onCancel }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

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
      className="dialog help-dialog"
      aria-labelledby="help-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <section className="dialog__content help-dialog__content">
        <div>
          <p className="eyebrow">Quick guide</p>
          <h2 id="help-dialog-title">How it works</h2>
        </div>

        <ul className="help-grid">
          <HelpItem
            visual={<span className="help-mini-button help-mini-button--dark">Add</span>}
            title="Add card"
          >
            Enter a year. It is placed in chronological order.
          </HelpItem>

          <HelpItem
            visual={<span className="help-mini-button help-mini-button--save">Save</span>}
            title="Save cards"
          >
            Locks every unsaved card as one round.
          </HelpItem>

          <HelpItem
            visual={<span className="help-mini-button">Clear</span>}
            title="Clear cards"
          >
            Removes unsaved cards. Tick the base option to restart.
          </HelpItem>

          <HelpItem
            visual={<span className="help-mini-icon"><PencilIcon /></span>}
            title="Edit card"
          >
            The centered card’s pen edits its year or deletes it.
          </HelpItem>

          <HelpItem
            visual={<span className="help-mini-tag">Lock</span>}
            title="Insta-lock"
          >
            Saves just one card. Undo it from the card or history.
          </HelpItem>

          <HelpItem
            visual={<span className="help-mini-icon"><HistoryIcon /></span>}
            title="History"
          >
            Opens saved rounds and lets you undo any save.
          </HelpItem>

          <HelpItem
            visual={<span className="help-mini-token">− ◉ +</span>}
            title="Tokens"
          >
            Use plus and minus to track your tokens manually.
          </HelpItem>

          <HelpItem
            visual={<span className="help-mini-cards">1985</span>}
            title="Timeline"
          >
            Swipe sideways to focus a card. The player name is editable.
          </HelpItem>
        </ul>

        <div className="dialog__actions help-dialog__actions">
          <button
            ref={closeButtonRef}
            type="button"
            className="button button--primary"
            onClick={onCancel}
          >
            Got it
          </button>
        </div>
      </section>
    </dialog>
  );
}
