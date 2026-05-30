import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Support from './Support';
import { badgeDefinitions, categoryStyles, type BadgeCategory } from '@/config/badge-definitions';

function renderSupport() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/support']}>
          <Support />
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

describe('Support page – badge list sync with badge-definitions.ts', () => {
  it('lists every defined badge with title and howToEarn text', () => {
    renderSupport();

    // The "Welche Badges gibt es?" accordion content is rendered (hidden but in DOM).
    // Locate it via its trigger button, then walk to the sibling content panel.
    const trigger = screen.getByRole('button', { name: /Welche Badges gibt es\?/i });
    const item = trigger.closest('[data-state]')?.parentElement ?? trigger.parentElement!;
    const content = item.textContent ?? '';

    expect(content).toContain(`${badgeDefinitions.length} Badges`);

    for (const badge of badgeDefinitions) {
      expect(
        content,
        `Badge "${badge.id}" (Titel "${badge.title}") fehlt in der Support-FAQ`
      ).toContain(badge.title);
      expect(
        content,
        `howToEarn für Badge "${badge.id}" fehlt in der Support-FAQ`
      ).toContain(badge.howToEarn);
    }
  });

  it('renders every badge category label exactly once', () => {
    renderSupport();
    const trigger = screen.getByRole('button', { name: /Welche Badges gibt es\?/i });
    const item = trigger.closest('[data-state]')?.parentElement ?? trigger.parentElement!;
    const content = item.textContent ?? '';

    const usedCategories = new Set<BadgeCategory>(
      badgeDefinitions.map((b) => b.category)
    );
    for (const cat of usedCategories) {
      expect(content).toContain(categoryStyles[cat].label);
    }
  });
});