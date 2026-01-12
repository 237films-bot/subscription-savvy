import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDaysUntilRenewal, getNextRenewalDate } from './dateUtils';

describe('dateUtils', () => {
  beforeEach(() => {
    // Reset time to a known date for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDaysUntilRenewal', () => {
    it('calculates days until next monthly renewal correctly', () => {
      // Renewal on 20th of each month, today is 15th
      const result = getDaysUntilRenewal(20, 'monthly');
      expect(result).toBe(5); // 20 - 15 = 5 days
    });

    it('calculates days for past renewal day in current month', () => {
      // Renewal on 10th (already passed), should be next month
      const result = getDaysUntilRenewal(10, 'monthly');
      expect(result).toBeGreaterThan(15); // Should be in next month
    });

    it('calculates days for same day renewal', () => {
      vi.setSystemTime(new Date('2025-01-15T00:00:00Z'));
      const result = getDaysUntilRenewal(15, 'monthly');
      expect(result).toBe(0); // Today is renewal day
    });

    it('handles annual billing cycle correctly', () => {
      // Today: Jan 15, 2025
      // Renewal: March 1st annually
      const result = getDaysUntilRenewal(1, 'annual', 3);
      expect(result).toBeGreaterThan(40); // Should be ~45 days
      expect(result).toBeLessThan(50);
    });

    it('handles annual renewal that already passed this year', () => {
      vi.setSystemTime(new Date('2025-04-15T12:00:00Z')); // April 15
      // Renewal: March 1st annually (already passed)
      const result = getDaysUntilRenewal(1, 'annual', 3);
      expect(result).toBeGreaterThan(300); // Should be next year
    });

    it('handles edge case of renewal on 31st', () => {
      // Test February handling (no 31st)
      vi.setSystemTime(new Date('2025-02-15T12:00:00Z'));
      const result = getDaysUntilRenewal(31, 'monthly');
      expect(result).toBeGreaterThan(0); // Should handle gracefully
    });
  });

  describe('getNextRenewalDate', () => {
    it('returns correct next renewal date for monthly cycle', () => {
      // Today: Jan 15, Renewal day: 20th
      const result = getNextRenewalDate(20, 'monthly');
      expect(result.getDate()).toBe(20);
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getFullYear()).toBe(2025);
    });

    it('returns next month if renewal day already passed', () => {
      // Today: Jan 15, Renewal day: 10th (passed)
      const result = getNextRenewalDate(10, 'monthly');
      expect(result.getDate()).toBe(10);
      expect(result.getMonth()).toBe(1); // February
    });

    it('returns correct annual renewal date', () => {
      // Today: Jan 15, 2025
      // Annual renewal: March 1st
      const result = getNextRenewalDate(1, 'annual', 3);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(2); // March (0-indexed)
      expect(result.getFullYear()).toBe(2025);
    });

    it('returns next year for passed annual renewal', () => {
      vi.setSystemTime(new Date('2025-04-15T12:00:00Z'));
      // Annual renewal: March 1st (already passed)
      const result = getNextRenewalDate(1, 'annual', 3);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(2); // March
      expect(result.getDate()).toBe(1);
    });
  });
});
