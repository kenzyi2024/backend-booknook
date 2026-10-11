import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReadingDate, applyReadingDates, ReadingDateError } from '../lib/readingDates.js';

test('a calendar date is stored as UTC midnight of that same day', () => {
  const d = normalizeReadingDate('2026-03-09');
  assert.equal(d.toISOString(), '2026-03-09T00:00:00.000Z');
});

test('empty string and null clear the date', () => {
  assert.equal(normalizeReadingDate(''), null);
  assert.equal(normalizeReadingDate(null), null);
});

test('impossible and malformed dates are rejected', () => {
  for (const bad of ['2026-02-30', '2026-13-01', 'yesterday', '12/03/2026x', 42, {}]) {
    assert.throws(() => normalizeReadingDate(bad), ReadingDateError, String(bad));
  }
});

test('legacy ISO timestamps are still accepted', () => {
  const d = normalizeReadingDate('2025-06-01T17:45:00.000Z');
  assert.equal(d.toISOString(), '2025-06-01T17:45:00.000Z');
});

test('finish before start is rejected; same day and open-ended are fine', () => {
  assert.throws(() => applyReadingDates({ startedAt: '2026-05-10', finishedAt: '2026-05-09' }), /before the start/);
  assert.doesNotThrow(() => applyReadingDates({ startedAt: '2026-05-10', finishedAt: '2026-05-10' }));
  assert.doesNotThrow(() => applyReadingDates({ startedAt: '2026-05-10' }));
  assert.doesNotThrow(() => applyReadingDates({ finishedAt: '2026-05-10' }));
});

test('a lone finish date is checked against the stored start date', () => {
  const existing = { startedAt: new Date('2026-05-10T00:00:00Z') };
  assert.throws(() => applyReadingDates({ finishedAt: '2026-05-01' }, existing), /before the start/);
  assert.doesNotThrow(() => applyReadingDates({ finishedAt: '2026-05-12' }, existing));
});

test('clearing the start date lifts the ordering constraint', () => {
  const existing = { startedAt: new Date('2026-05-10T00:00:00Z'), finishedAt: new Date('2026-05-20T00:00:00Z') };
  const out = applyReadingDates({ startedAt: '' }, existing);
  assert.equal(out.startedAt, null);
});

test('updates without date fields pass through untouched', () => {
  const updates = { title: 'Dune' };
  assert.equal(applyReadingDates(updates), updates);
  assert.deepEqual(updates, { title: 'Dune' });
});
