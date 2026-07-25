const MIN_YEAR = 1;
const MAX_YEAR = 9999;
const MAX_PLAYER_NAME_LENGTH = 40;
const DEFAULT_TOKEN_COUNT = 0;
const MAX_TOKEN_COUNT = 99;

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function validateYear(value) {
  const trimmedValue = String(value).trim();

  if (!trimmedValue) {
    return { valid: false, message: 'Enter a year.' };
  }

  if (!/^\d+$/.test(trimmedValue)) {
    return { valid: false, message: 'Use a whole-number year.' };
  }

  const year = Number(trimmedValue);

  if (!Number.isSafeInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return {
      valid: false,
      message: `Enter a year from ${MIN_YEAR} to ${MAX_YEAR}.`,
    };
  }

  return { valid: true, year };
}

export function validatePlayerName(value) {
  const name = String(value).trim().replace(/\s+/g, ' ');

  if (!name) {
    return { valid: false, message: 'Enter a player name.' };
  }

  if (name.length > MAX_PLAYER_NAME_LENGTH) {
    return {
      valid: false,
      message: `Use ${MAX_PLAYER_NAME_LENGTH} characters or fewer.`,
    };
  }

  return { valid: true, name };
}

export function createCard(
  year,
  {
    isBase = false,
    order = Date.now(),
    id = makeId(),
    round = isBase ? 0 : 1,
    saved = isBase,
    saveId = null,
    saveMethod = isBase ? 'base' : saved ? 'batch' : null,
    savedAt = null,
  } = {},
) {
  return {
    id,
    year,
    isBase,
    order,
    round,
    saved,
    saveId: saved && !isBase ? saveId : null,
    saveMethod: isBase ? 'base' : saved ? saveMethod : null,
    savedAt: saved && !isBase ? savedAt : null,
  };
}

export function sortCards(cards) {
  return [...cards].sort((left, right) => {
    return left.year - right.year || left.order - right.order;
  });
}

export function getLatestSavedRound(cards) {
  return cards.reduce((latestRound, card) => {
    const closesRound =
      card.isBase || (card.saved && card.saveMethod !== 'instant');
    return closesRound ? Math.max(latestRound, card.round) : latestRound;
  }, 0);
}

export function saveCardBatch(
  cards,
  { id = makeId(), savedAt = Date.now() } = {},
) {
  const pendingCards = cards.filter((card) => !card.saved && !card.isBase);

  if (pendingCards.length === 0) {
    return { cards, event: null };
  }

  const event = {
    id,
    type: 'batch',
    cardIds: pendingCards.map((card) => card.id),
    round: pendingCards.reduce(
      (latestRound, card) => Math.max(latestRound, card.round),
      1,
    ),
    savedAt,
  };

  return {
    cards: cards.map((card) => (
      event.cardIds.includes(card.id)
        ? {
            ...card,
            saved: true,
            saveId: event.id,
            saveMethod: 'batch',
            savedAt,
          }
        : card
    )),
    event,
  };
}

export function saveCards(cards) {
  return saveCardBatch(cards).cards;
}

export function instaLockCard(
  cards,
  cardId,
  { id = makeId(), savedAt = Date.now() } = {},
) {
  const card = cards.find((candidate) => candidate.id === cardId);

  if (!card || card.isBase || card.saved) {
    return { cards, event: null };
  }

  const event = {
    id,
    type: 'instant',
    cardIds: [cardId],
    round: card.round,
    savedAt,
  };

  return {
    cards: cards.map((candidate) => (
      candidate.id === cardId
        ? {
            ...candidate,
            saved: true,
            saveId: event.id,
            saveMethod: 'instant',
            savedAt,
          }
        : candidate
    )),
    event,
  };
}

export function undoSaveEvent(cards, eventId) {
  return cards.map((card) => (
    !card.isBase && card.saveId === eventId
      ? {
          ...card,
          saved: false,
          saveId: null,
          saveMethod: null,
          savedAt: null,
        }
      : card
  ));
}

export function changeCardYear(cards, cardId, year) {
  const result = validateYear(year);
  if (!result.valid) return cards;

  return sortCards(cards.map((card) => (
    card.id === cardId ? { ...card, year: result.year } : card
  )));
}

export function deleteCard(cards, cardId) {
  return cards.filter((card) => card.id !== cardId || card.isBase);
}

export function removeCardFromHistory(history, cardId) {
  return history.flatMap((event) => {
    const cardIds = event.cardIds.filter((id) => id !== cardId);
    return cardIds.length > 0 ? [{ ...event, cardIds }] : [];
  });
}

export function clearUnsavedCards(cards) {
  return cards.filter((card) => card.saved || card.isBase);
}

export function normalizeTokenCount(value) {
  if (value === null || value === undefined || value === '') {
    return DEFAULT_TOKEN_COUNT;
  }

  const count = Number(value);
  return Number.isInteger(count) && count >= 0 && count <= MAX_TOKEN_COUNT
    ? count
    : DEFAULT_TOKEN_COUNT;
}

export function normalizeSaveHistory(value, cards) {
  if (!Array.isArray(value)) return [];

  const seenIds = new Set();

  return value.flatMap((event) => {
    if (!event || typeof event !== 'object') return [];

    const id = typeof event.id === 'string' ? event.id : '';
    if (!id || seenIds.has(id)) return [];
    seenIds.add(id);

    const type = event.type === 'instant' ? 'instant' : event.type === 'batch'
      ? 'batch'
      : null;
    if (!type) return [];

    const cardIds = Array.isArray(event.cardIds)
      ? [...new Set(event.cardIds)].filter((cardId) => (
          cards.some((card) => (
            card.id === cardId
            && card.saved
            && card.saveId === id
            && !card.isBase
          ))
        ))
      : [];

    if (cardIds.length === 0) return [];

    return [{
      id,
      type,
      cardIds,
      round:
        Number.isInteger(event.round) && event.round >= 1
          ? event.round
          : 1,
      savedAt: Number.isFinite(event.savedAt) ? event.savedAt : Date.now(),
    }];
  });
}

export function normalizeCards(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set();
  const validCards = value.flatMap((card, index) => {
    if (!card || typeof card !== 'object') {
      return [];
    }

    const year = Number(card.year);

    if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
      return [];
    }

    let id = typeof card.id === 'string' && card.id ? card.id : makeId();
    if (seenIds.has(id)) {
      id = makeId();
    }
    seenIds.add(id);

    const isBase = card.isBase === true;
    const saved = isBase || card.saved !== false;
    const saveMethod = isBase
      ? 'base'
      : saved && card.saveMethod === 'instant'
        ? 'instant'
        : saved
          ? 'batch'
          : null;

    return [{
      id,
      year,
      isBase,
      order: Number.isFinite(card.order) ? card.order : index,
      round:
        Number.isInteger(card.round) && card.round >= 0
          ? card.round
          : isBase
            ? 0
            : 1,
      saved,
      saveId:
        saved && !isBase && typeof card.saveId === 'string' && card.saveId
          ? card.saveId
          : null,
      saveMethod,
      savedAt:
        saved && !isBase && Number.isFinite(card.savedAt)
          ? card.savedAt
          : null,
    }];
  });

  const baseIndex = validCards.findIndex((card) => card.isBase);

  if (baseIndex === -1) {
    return [];
  }

  return sortCards(
    validCards.map((card, index) => {
      const isBase = index === baseIndex;
      const saved = isBase ? true : card.saved;

      return {
        ...card,
        isBase,
        round: isBase ? 0 : Math.max(1, card.round),
        saved,
        saveId: isBase || !saved ? null : card.saveId,
        saveMethod:
          isBase
            ? 'base'
            : saved
              ? card.saveMethod === 'instant' ? 'instant' : 'batch'
              : null,
        savedAt: isBase || !saved ? null : card.savedAt,
      };
    }),
  );
}
