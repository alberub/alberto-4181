import { expect, it } from 'vitest';
import { snails, races, raceStats, betStats } from './fixtures';
it('keeps six races, six snails and mutually consistent statistics', () => {
  expect(snails).toHaveLength(6);
  expect(races).toHaveLength(6);
  expect(races.every((race) => snails.some((snail) => snail.id === race.winnerId))).toBe(true);
  expect(raceStats.reduce((sum, snail) => sum + snail.wins, 0)).toBe(6);
  expect(betStats.reduce((sum, bet) => sum + bet.value, 0)).toBe(6);
});
