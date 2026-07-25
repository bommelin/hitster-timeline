import test from 'node:test';
import assert from 'node:assert/strict';
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
  saveCards,
  sortCards,
  undoSaveEvent,
  validatePlayerName,
  validateYear,
} from '../src/lib/cards.js';

test('validates whole-number years', () => {
  assert.deepEqual(validateYear('1984'), { valid: true, year: 1984 });
  assert.equal(validateYear('').valid, false);
  assert.equal(validateYear('1984.5').valid, false);
  assert.equal(validateYear('-1').valid, false);
  assert.equal(validateYear('10000').valid, false);
});

test('validates and normalizes player names', () => {
  assert.deepEqual(validatePlayerName('  Felix   Bommelin  '), {
    valid: true,
    name: 'Felix Bommelin',
  });
  assert.equal(validatePlayerName('   ').valid, false);
  assert.equal(validatePlayerName('x'.repeat(41)).valid, false);
});

test('sorts cards by year while retaining duplicate insertion order', () => {
  const cards = [
    createCard(2000, { id: 'third', order: 3 }),
    createCard(1980, { id: 'first', order: 1 }),
    createCard(1980, { id: 'second', order: 2 }),
  ];

  assert.deepEqual(sortCards(cards).map((card) => card.id), ['first', 'second', 'third']);
});

test('saves and clears only the current unsaved round', () => {
  const base = createCard(1990, { id: 'base', isBase: true });
  const saved = createCard(2000, { id: 'saved', round: 1, saved: true });
  const pending = createCard(2010, { id: 'pending', round: 2, saved: false });

  assert.deepEqual(clearUnsavedCards([base, saved, pending]), [base, saved]);
  assert.equal(saveCards([base, pending]).every((card) => card.saved), true);
  assert.equal(getLatestSavedRound([base, saved, pending]), 1);
});

test('insta-locks one card without closing the round and can undo it', () => {
  const base = createCard(1990, { id: 'base', isBase: true });
  const first = createCard(2000, {
    id: 'first',
    round: 1,
    saved: false,
  });
  const second = createCard(2010, {
    id: 'second',
    round: 1,
    saved: false,
  });

  const locked = instaLockCard([base, first, second], 'first', {
    id: 'instant-1',
    savedAt: 100,
  });

  assert.deepEqual(locked.event, {
    id: 'instant-1',
    type: 'instant',
    cardIds: ['first'],
    round: 1,
    savedAt: 100,
  });
  assert.equal(locked.cards.find((card) => card.id === 'first').saved, true);
  assert.equal(locked.cards.find((card) => card.id === 'second').saved, false);
  assert.equal(getLatestSavedRound(locked.cards), 0);

  const undone = undoSaveEvent(locked.cards, 'instant-1');
  assert.equal(undone.find((card) => card.id === 'first').saved, false);
  assert.equal(undone.find((card) => card.id === 'first').saveMethod, null);
});

test('saves pending cards as one undoable batch', () => {
  const base = createCard(1980, { id: 'base', isBase: true });
  const first = createCard(1990, { id: 'first', round: 1, saved: false });
  const second = createCard(2000, { id: 'second', round: 1, saved: false });

  const result = saveCardBatch([base, first, second], {
    id: 'batch-1',
    savedAt: 200,
  });

  assert.deepEqual(result.event.cardIds, ['first', 'second']);
  assert.equal(result.event.type, 'batch');
  assert.equal(result.cards.every((card) => card.saved), true);
  assert.equal(getLatestSavedRound(result.cards), 1);

  const undone = undoSaveEvent(result.cards, 'batch-1');
  assert.equal(undone.find((card) => card.id === 'base').saved, true);
  assert.equal(undone.filter((card) => !card.isBase).every((card) => !card.saved), true);
});

test('edits, sorts, and deletes non-base cards while protecting the base', () => {
  const base = createCard(1990, { id: 'base', isBase: true, order: 1 });
  const card = createCard(2000, { id: 'card', order: 2, saved: false });

  const edited = changeCardYear([base, card], 'card', 1980);
  assert.deepEqual(edited.map((item) => item.id), ['card', 'base']);
  assert.equal(edited[0].year, 1980);

  assert.deepEqual(deleteCard(edited, 'base'), edited);
  assert.deepEqual(deleteCard(edited, 'card').map((item) => item.id), ['base']);
});

test('normalizes tokens and save history and removes deleted cards from history', () => {
  const base = createCard(1980, { id: 'base', isBase: true });
  const saved = createCard(1990, {
    id: 'saved',
    round: 1,
    saved: true,
    saveId: 'batch-1',
    saveMethod: 'batch',
    savedAt: 300,
  });
  const history = [{
    id: 'batch-1',
    type: 'batch',
    cardIds: ['saved', 'missing'],
    round: 1,
    savedAt: 300,
  }];

  assert.equal(normalizeTokenCount(null), 0);
  assert.equal(normalizeTokenCount('5'), 5);
  assert.equal(normalizeTokenCount('-1'), 0);

  assert.deepEqual(normalizeSaveHistory(history, [base, saved]), [{
    ...history[0],
    cardIds: ['saved'],
  }]);
  assert.deepEqual(removeCardFromHistory(history, 'saved'), [{
    ...history[0],
    cardIds: ['missing'],
  }]);
  assert.deepEqual(removeCardFromHistory(history, 'missing'), [{
    ...history[0],
    cardIds: ['saved'],
  }]);
});

test('rejects stored timelines without a base and normalizes multiple bases', () => {
  assert.deepEqual(normalizeCards([{ id: 'one', year: 1990, isBase: false }]), []);

  const normalized = normalizeCards([
    { id: 'one', year: 1990, isBase: true, order: 1 },
    { id: 'two', year: 2000, isBase: true, order: 2 },
  ]);

  assert.equal(normalized.filter((card) => card.isBase).length, 1);
  assert.equal(normalized[0].id, 'one');
  assert.equal(normalized[0].round, 0);
  assert.equal(normalized[0].saved, true);
  assert.equal(normalized[0].saveMethod, 'base');
  assert.equal(normalized[1].round, 1);
  assert.equal(normalized[1].saved, true);
  assert.equal(normalized[1].saveMethod, 'batch');
});
