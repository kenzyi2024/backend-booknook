/**
 * Reading dates (`startedAt` / `finishedAt`) are calendar dates, not moments in
 * time. Clients send them as 'YYYY-MM-DD'; we store them as UTC midnight of
 * that day so the date part of the stored ISO string is always the same
 * calendar day the reader picked, whatever their timezone.
 *
 * Older books may hold a full timestamp in `finishedAt` (it used to be set to
 * "now" when a book was finished). Those are left untouched and still accepted.
 */

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export class ReadingDateError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

/**
 * Normalize a client-supplied reading date.
 * Returns `null` to clear the field, a Date for a valid value, or throws a
 * ReadingDateError for anything that isn't a real calendar date.
 */
export function normalizeReadingDate(value, label = 'Date') {
  if (value === null || value === '') return null;
  if (typeof value !== 'string') throw new ReadingDateError(`${label} must be a date.`);

  const m = DATE_KEY_RE.exec(value);
  if (m) {
    const [, y, mo, d] = m.map(Number);
    const date = new Date(Date.UTC(y, mo - 1, d));
    // Reject impossible days like 2026-02-30 (Date would silently roll them over).
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
      throw new ReadingDateError(`${label} is not a valid date.`);
    }
    if (y < 1000 || y > 9999) throw new ReadingDateError(`${label} is not a valid date.`);
    return date;
  }

  // Legacy/ISO timestamp (e.g. a round-tripped finishedAt) — accept if parseable.
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ReadingDateError(`${label} is not a valid date.`);
  return date;
}

/** Calendar-day key used to compare two stored reading dates. */
const dayKey = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

/** Throws if the finish date falls before the start date (same day is fine). */
export function assertDateOrder(startedAt, finishedAt) {
  const s = dayKey(startedAt);
  const f = dayKey(finishedAt);
  if (s && f && f < s) {
    throw new ReadingDateError('The finish date can’t be before the start date.');
  }
}

/**
 * Normalize the reading-date fields present in `updates` (in place) and check
 * their order against the existing values for any field not being changed.
 */
export function applyReadingDates(updates, existing = {}) {
  const touched = 'startedAt' in updates || 'finishedAt' in updates;
  if (!touched) return updates;
  if ('startedAt' in updates) updates.startedAt = normalizeReadingDate(updates.startedAt, 'Start date');
  if ('finishedAt' in updates) updates.finishedAt = normalizeReadingDate(updates.finishedAt, 'Finish date');
  const started = 'startedAt' in updates ? updates.startedAt : existing.startedAt;
  const finished = 'finishedAt' in updates ? updates.finishedAt : existing.finishedAt;
  assertDateOrder(started, finished);
  return updates;
}
