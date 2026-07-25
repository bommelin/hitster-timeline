import React, { useEffect, useRef, useState } from 'react';
import { validateYear } from '../lib/cards.js';

export default function CardDialog({
  open,
  card,
  onCancel,
  onDelete,
  onInstaLock,
  onSaveYear,
  onUndoInstaLock,
}) {
  const dialogRef = useRef(null);
  const yearInputRef = useRef(null);
  const backButtonRef = useRef(null);
  const [yearValue, setYearValue] = useState('');
  const [yearError, setYearError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open && card && !dialog.open) {
      setYearValue(String(card.year));
      setYearError('');
      setConfirmingDelete(false);
      dialog.showModal();
      requestAnimationFrame(() => {
        yearInputRef.current?.focus();
        yearInputRef.current?.select();
      });
    } else if ((!open || !card) && dialog.open) {
      dialog.close();
    }

    return undefined;
  }, [open, card]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!card || confirmingDelete) return;

    const result = validateYear(yearValue);
    if (!result.valid) {
      setYearError(result.message);
      yearInputRef.current?.focus();
      return;
    }

    onSaveYear(card.id, result.year);
  }

  function handleCancel() {
    if (confirmingDelete) {
      setConfirmingDelete(false);
      requestAnimationFrame(() => yearInputRef.current?.focus());
    } else {
      onCancel();
    }
  }

  if (!card) return null;

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="card-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        handleCancel();
      }}
    >
      <form className="dialog__content" onSubmit={handleSubmit} noValidate>
        {confirmingDelete ? (
          <>
            <div>
              <p className="eyebrow">Delete card</p>
              <h2 id="card-dialog-title">Delete {card.year}?</h2>
              <p className="dialog__description">
                This removes the card from the timeline. Saved cards will also
                be removed from their history entry.
              </p>
            </div>

            <div className="dialog__actions">
              <button
                ref={backButtonRef}
                type="button"
                className="button button--quiet"
                onClick={handleCancel}
              >
                Go back
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={() => onDelete(card.id)}
              >
                Delete card
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="eyebrow">Card options</p>
              <h2 id="card-dialog-title">Edit {card.year}</h2>
            </div>

            <div className="dialog__section">
              <div className="field">
                <label htmlFor="edited-card-year">Year</label>
                <input
                  ref={yearInputRef}
                  id="edited-card-year"
                  name="editedCardYear"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={yearValue}
                  aria-describedby={yearError ? 'edited-year-error' : undefined}
                  aria-invalid={Boolean(yearError)}
                  onChange={(event) => {
                    setYearValue(event.target.value);
                    if (yearError) setYearError('');
                  }}
                />
                <p id="edited-year-error" className="field__error" aria-live="polite">
                  {yearError || '\u00a0'}
                </p>
              </div>
              <button type="submit" className="button button--primary">
                Save year
              </button>
            </div>

            <div className="dialog__section dialog__section--divided">
              {card.isBase ? (
                <p className="card-menu__note">The base card is always saved.</p>
              ) : !card.saved ? (
                <button
                  type="button"
                  className="button button--save"
                  onClick={() => onInstaLock(card.id)}
                >
                  Insta-lock card
                </button>
              ) : card.saveMethod === 'instant' ? (
                <button
                  type="button"
                  className="button button--quiet"
                  onClick={() => onUndoInstaLock(card.saveId)}
                >
                  Undo insta-lock
                </button>
              ) : (
                <p className="card-menu__note">
                  Saved with its round. Use history to undo the batch.
                </p>
              )}

              <button
                type="button"
                className="button button--danger-outline"
                disabled={card.isBase}
                onClick={() => {
                  setConfirmingDelete(true);
                  requestAnimationFrame(() => backButtonRef.current?.focus());
                }}
              >
                {card.isBase ? 'Base card cannot be deleted' : 'Delete card'}
              </button>
            </div>

            <div className="dialog__actions">
              <button
                type="button"
                className="button button--quiet"
                onClick={onCancel}
              >
                Close
              </button>
            </div>
          </>
        )}
      </form>
    </dialog>
  );
}
