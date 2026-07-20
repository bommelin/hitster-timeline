import React, { useEffect, useRef, useState } from 'react';
import { validatePlayerName } from '../lib/cards.js';

export default function PlayerNameDialog({ open, currentName, onCancel, onSubmit }) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const [value, setValue] = useState(currentName);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open && !dialog.open) {
      setValue(currentName);
      setError('');
      dialog.showModal();
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return undefined;
  }, [open, currentName]);

  function handleSubmit(event) {
    event.preventDefault();
    const result = validatePlayerName(value);

    if (!result.valid) {
      setError(result.message);
      inputRef.current?.focus();
      return;
    }

    onSubmit(result.name);
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="name-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <form className="dialog__content" onSubmit={handleSubmit} noValidate>
        <div>
          <p className="eyebrow">Player</p>
          <h2 id="name-dialog-title">Change player name</h2>
        </div>

        <div className="field">
          <label htmlFor="changed-player-name">Player name</label>
          <input
            ref={inputRef}
            id="changed-player-name"
            name="changedPlayerName"
            type="text"
            autoComplete="off"
            maxLength="40"
            value={value}
            aria-describedby={error ? 'changed-name-error' : undefined}
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError('');
            }}
          />
          <p id="changed-name-error" className="field__error" aria-live="polite">
            {error || '\u00a0'}
          </p>
        </div>

        <div className="dialog__actions">
          <button type="button" className="button button--quiet" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="button button--primary">
            Save name
          </button>
        </div>
      </form>
    </dialog>
  );
}
