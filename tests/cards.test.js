import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearUnsavedCards,
  createCard,
  getLatestSavedRound,
  normalizeCards,
  saveCards,
  sortCards,
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
  assert.equal(normalized[1].round, 1);
  assert.equal(normalized[1].saved, true);
});
