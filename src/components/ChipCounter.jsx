import React from 'react';

function ChipIcon() {
  return (
    <svg className="chip-icon" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="11.5" />
      <circle cx="14" cy="14" r="6.5" />
      <path d="M14 2.5v4M14 21.5v4M2.5 14h4M21.5 14h4M5.9 5.9l2.8 2.8M19.3 19.3l2.8 2.8M22.1 5.9l-2.8 2.8M8.7 19.3l-2.8 2.8" />
    </svg>
  );
}

export default function ChipCounter({ count, onAdd, onRemove }) {
  return (
    <div className="chip-control" role="group" aria-label="Tokens">
      <button
        type="button"
        className="icon-button chip-control__button"
        disabled={count === 0}
        aria-label="Remove token"
        onClick={onRemove}
      >
        <span aria-hidden="true">−</span>
      </button>
      <div className="chip-control__value">
        <ChipIcon />
        <output aria-live="polite" aria-label={`${count} tokens`}>
          {count}
        </output>
      </div>
      <button
        type="button"
        className="icon-button chip-control__button"
        disabled={count >= 99}
        aria-label="Add token"
        onClick={onAdd}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
