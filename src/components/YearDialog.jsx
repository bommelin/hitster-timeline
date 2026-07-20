import React, { useEffect, useRef, useState } from 'react';
import { validatePlayerName, validateYear } from '../lib/cards.js';

export default function YearDialog({
  open,
  isBase,
  existingPlayerName,
  onCancel,
  onSubmit,
}) {
  const dialogRef = useRef(null);
  const nameInputRef = useRef(null);
  const yearInputRef = useRef(null);
  const [nameValue, setNameValue] = useState('');
  const [yearValue, setYearValue] = useState('');
  const [nameError, setNameError] = useState('');
  const [yearError, setYearError] = useState('');
  const shouldAskForName = isBase && !existingPlayerName;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open && !dialog.open) {
      setNameValue('');
      setYearValue('');
      setNameError('');
      setYearError('');
      dialog.showModal();
      requestAnimationFrame(() => {
        if (shouldAskForName) {
          nameInputRef.current?.focus();
        } else {
          yearInputRef.current?.focus();
        }
      });
    } else if (!open && dialog.open) {
      dialog.close();
    }

    return undefined;
  }, [open, shouldAskForName]);

  function handleSubmit(event) {
    event.preventDefault();
    const nameResult = shouldAskForName
      ? validatePlayerName(nameValue)
      : { valid: true, name: existingPlayerName || '' };
    const yearResult = validateYear(yearValue);

    setNameError(nameResult.valid ? '' : nameResult.message);
    setYearError(yearResult.valid ? '' : yearResult.message);

    if (!nameResult.valid) {
      nameInputRef.current?.focus();
      return;
    }

    if (!yearResult.valid) {
      yearInputRef.current?.focus();
      return;
    }

    onSubmit(yearResult.year, nameResult.name);
  }

  function handleYearChange(event) {
    setYearValue(event.target.value);
    if (yearError) setYearError('');
  }

  function handleNameChange(event) {
    setNameValue(event.target.value);
    if (nameError) setNameError('');
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="year-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <form className="dialog__content" onSubmit={handleSubmit} noValidate>
        <div>
          <p className="eyebrow">{isBase ? 'Start your timeline' : 'New card'}</p>
          <h2 id="year-dialog-title">
            {isBase ? 'Create base card' : 'Enter a year'}
          </h2>
        </div>

        <div className="dialog__fields">
          {shouldAskForName && (
            <div className="field">
              <label htmlFor="player-name">Player name</label>
              <input
                ref={nameInputRef}
                id="player-name"
                name="playerName"
                type="text"
                autoComplete="off"
                maxLength="40"
                placeholder="e.g. Felix"
                value={nameValue}
                aria-describedby={nameError ? 'name-error' : undefined}
                aria-invalid={Boolean(nameError)}
                onChange={handleNameChange}
              />
              <p id="name-error" className="field__error" aria-live="polite">
                {nameError || '\u00a0'}
              </p>
            </div>
          )}

          <div className="field">
            <label htmlFor="card-year">Year</label>
            <input
              ref={yearInputRef}
              id="card-year"
              name="year"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 1984"
              value={yearValue}
              aria-describedby={yearError ? 'year-error' : undefined}
              aria-invalid={Boolean(yearError)}
              onChange={handleYearChange}
            />
            <p id="year-error" className="field__error" aria-live="polite">
              {yearError || '\u00a0'}
            </p>
          </div>
        </div>

        <div className="dialog__actions">
          <button type="button" className="button button--quiet" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="button button--primary">
            {isBase ? 'Create card' : 'Add card'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
