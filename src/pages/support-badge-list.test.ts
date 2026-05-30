import { describe, it, expect } from 'vitest';
import {
  supportBadgeListText,
  supportTotalBadgeCount,
  supportBadgeCategoryOrder,
} from './support-badge-list';
import { badgeDefinitions, categoryStyles, type BadgeCategory } from '@/config/badge-definitions';

describe('Support FAQ badge list ↔ badge-definitions.ts', () => {
  it('total count matches the number of defined badges', () => {
    expect(supportTotalBadgeCount).toBe(badgeDefinitions.length);
  });

  it('lists every defined badge with its title and howToEarn text', () => {
    for (const badge of badgeDefinitions) {
      expect(
        supportBadgeListText,
        `Badge "${badge.id}" (Titel "${badge.title}") fehlt in der Support-FAQ`
      ).toContain(badge.title);
      expect(
        supportBadgeListText,
        `howToEarn für Badge "${badge.id}" fehlt in der Support-FAQ`
      ).toContain(badge.howToEarn);
    }
  });

  it('renders the label of every used badge category', () => {
    const usedCategories = new Set<BadgeCategory>(
      badgeDefinitions.map((b) => b.category)
    );
    for (const cat of usedCategories) {
      expect(supportBadgeListText).toContain(`${categoryStyles[cat].label}:`);
    }
  });

  it('covers every category that exists in badge-definitions in the ordering array', () => {
    const usedCategories = new Set<BadgeCategory>(
      badgeDefinitions.map((b) => b.category)
    );
    for (const cat of usedCategories) {
      expect(
        supportBadgeCategoryOrder,
        `Kategorie "${cat}" fehlt in supportBadgeCategoryOrder`
      ).toContain(cat);
    }
  });
});