import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { ActivityCard } from '@/components/activity/ActivityCard';
import { z } from 'zod';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockActivity = {
  id: 'test-activity-id',
  user_id: 'test-user-id',
  start_date: new Date().toISOString(),
  total_distance: 5000,
  total_time: 1800,
  segment_count: 3,
  segments: ['Segment 1', 'Segment 2', 'Segment 3'],
  profiles: {
    first_name: 'Test',
    last_name: 'User',
    profile_picture: null,
  },
};

describe('Comment Validation Security Tests', () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  describe('Frontend Validation', () => {
    it('should reject comments shorter than 2 characters', async () => {
      const user = userEvent.setup();
      render(<ActivityCard activity={mockActivity} />);

      // Open comments section
      const commentButton = screen.getByRole('button', { name: /message/i });
      await user.click(commentButton);

      // Try to submit 1-character comment
      const textarea = screen.getByPlaceholderText(/schreibe einen kommentar/i);
      await user.type(textarea, 'a');

      const submitButton = screen.getByRole('button', { name: /posten/i });
      await user.click(submitButton);

      // Should show error toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Ungültiger Kommentar',
            description: 'Kommentar muss mindestens 2 Zeichen lang sein',
            variant: 'destructive',
          })
        );
      });
    });

    it('should reject comments longer than 1000 characters', async () => {
      const user = userEvent.setup();
      render(<ActivityCard activity={mockActivity} />);

      const commentButton = screen.getByRole('button', { name: /message/i });
      await user.click(commentButton);

      // Create 1001 character string
      const longComment = 'A'.repeat(1001);
      const textarea = screen.getByPlaceholderText(/schreibe einen kommentar/i);
      await user.type(textarea, longComment);

      const submitButton = screen.getByRole('button', { name: /posten/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Ungültiger Kommentar',
            description: 'Kommentar darf maximal 1000 Zeichen lang sein',
            variant: 'destructive',
          })
        );
      });
    });

    it('should accept valid comments between 2 and 1000 characters', async () => {
      const user = userEvent.setup();
      render(<ActivityCard activity={mockActivity} />);

      const commentButton = screen.getByRole('button', { name: /message/i });
      await user.click(commentButton);

      const textarea = screen.getByPlaceholderText(/schreibe einen kommentar/i);
      await user.type(textarea, 'Great run!');

      const submitButton = screen.getByRole('button', { name: /posten/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Kommentar gepostet',
            description: 'Dein Kommentar wurde erfolgreich hinzugefügt',
          })
        );
      });
    });

    it('should show character counter', async () => {
      const user = userEvent.setup();
      render(<ActivityCard activity={mockActivity} />);

      const commentButton = screen.getByRole('button', { name: /message/i });
      await user.click(commentButton);

      const textarea = screen.getByPlaceholderText(/schreibe einen kommentar/i);
      await user.type(textarea, 'Test');

      expect(screen.getByText(/4\/1000 zeichen/i)).toBeInTheDocument();
    });

    it('should trim whitespace before validation', async () => {
      const user = userEvent.setup();
      render(<ActivityCard activity={mockActivity} />);

      const commentButton = screen.getByRole('button', { name: /message/i });
      await user.click(commentButton);

      const textarea = screen.getByPlaceholderText(/schreibe einen kommentar/i);
      await user.type(textarea, '   '); // Only spaces

      const submitButton = screen.getByRole('button', { name: /posten/i });
      
      // Button should be disabled for empty trimmed content
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Schema Validation', () => {
    it('should validate using zod schema', () => {
      const CommentSchema = z.object({
        comment_text: z.string()
          .min(2, 'Kommentar muss mindestens 2 Zeichen lang sein')
          .max(1000, 'Kommentar darf maximal 1000 Zeichen lang sein')
          .trim()
      });

      // Test too short
      const resultShort = CommentSchema.safeParse({ comment_text: 'a' });
      expect(resultShort.success).toBe(false);
      if (!resultShort.success) {
        expect(resultShort.error.issues[0].message).toBe('Kommentar muss mindestens 2 Zeichen lang sein');
      }

      // Test too long
      const resultLong = CommentSchema.safeParse({ comment_text: 'A'.repeat(1001) });
      expect(resultLong.success).toBe(false);
      if (!resultLong.success) {
        expect(resultLong.error.issues[0].message).toBe('Kommentar darf maximal 1000 Zeichen lang sein');
      }

      // Test valid
      const resultValid = CommentSchema.safeParse({ comment_text: 'Valid comment' });
      expect(resultValid.success).toBe(true);
    });

    it('should automatically trim input', () => {
      const CommentSchema = z.object({
        comment_text: z.string().trim()
      });

      const result = CommentSchema.parse({ comment_text: '  test  ' });
      expect(result.comment_text).toBe('test');
    });
  });
});
