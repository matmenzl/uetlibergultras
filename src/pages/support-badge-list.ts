import { badgeDefinitions, categoryStyles, type BadgeCategory } from '@/config/badge-definitions';

/**
 * Single source of truth for the badge listing rendered in the Support FAQ.
 * Keeping this in its own module lets us unit-test it without rendering the page
 * (the FAQ accordion only mounts content when expanded).
 */
export const supportBadgeCategoryOrder: BadgeCategory[] = [
  'milestone',
  'endurance',
  'weather',
  'community',
  'legend',
];

export const supportBadgeListText = supportBadgeCategoryOrder
  .map((cat) => {
    const items = badgeDefinitions.filter((b) => b.category === cat);
    if (items.length === 0) return '';
    const lines = items.map((b) => `• ${b.title} – ${b.howToEarn}`).join('\n');
    return `${categoryStyles[cat].label}:\n${lines}`;
  })
  .filter(Boolean)
  .join('\n\n');

export const supportTotalBadgeCount = badgeDefinitions.length;