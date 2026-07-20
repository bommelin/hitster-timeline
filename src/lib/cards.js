const MIN_YEAR = 1;
const MAX_YEAR = 9999;
const MAX_PLAYER_NAME_LENGTH = 40;

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
  } = {},
) {
  return { id, year, isBase, order, round, saved };
}

export function sortCards(cards) {
  return [...cards].sort((left, right) => {
    return left.year - right.year || left.order - right.order;
  });
}

export function getLatestSavedRound(cards) {
  return cards.reduce((latestRound, card) => {
    return card.saved ? Math.max(latestRound, card.round) : latestRound;
  }, 0);
}

export function saveCards(cards) {
  return cards.map((card) => (card.saved ? card : { ...card, saved: true }));
}

export function clearUnsavedCards(cards) {
  return cards.filter((card) => card.saved || card.isBase);
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

    return [{
      id,
      year,
      isBase: card.isBase === true,
      order: Number.isFinite(card.order) ? card.order : index,
      round:
        Number.isInteger(card.round) && card.round >= 0
          ? card.round
          : card.isBase === true
            ? 0
            : 1,
      saved: card.isBase === true || card.saved !== false,
    }];
  });

  const baseIndex = validCards.findIndex((card) => card.isBase);

  if (baseIndex === -1) {
    return [];
  }

  return sortCards(
    validCards.map((card, index) => ({
      ...card,
      isBase: index === baseIndex,
      round: index === baseIndex ? 0 : Math.max(1, card.round),
      saved: index === baseIndex ? true : card.saved,
    })),
  );
}
