import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { useMediaNavigation } from '@/lib/hooks/useMediaNavigation';

function SwipeTestComponent({ total }: { total: number }) {
  const { index, swipeHandlers } = useMediaNavigation(total);
  return (
    <div data-testid="swipe-area" {...swipeHandlers}>
      <span data-testid="index">{index}</span>
    </div>
  );
}

describe('useMediaNavigation swipe handlers', () => {
  it('swipes left to go next', () => {
    render(<SwipeTestComponent total={3} />);
    const area = screen.getByTestId('swipe-area');

    fireEvent.touchStart(area, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 50, clientY: 100 }] });

    expect(screen.getByTestId('index').textContent).toBe('1');
  });

  it('swipes right to go prev', () => {
    render(<SwipeTestComponent total={3} />);
    const area = screen.getByTestId('swipe-area');

    // Move to index 1 first
    fireEvent.touchStart(area, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 50, clientY: 100 }] });
    expect(screen.getByTestId('index').textContent).toBe('1');

    // Swipe right to go back
    fireEvent.touchStart(area, { touches: [{ clientX: 50, clientY: 100 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 200, clientY: 100 }] });
    expect(screen.getByTestId('index').textContent).toBe('0');
  });

  it('ignores short swipes', () => {
    render(<SwipeTestComponent total={3} />);
    const area = screen.getByTestId('swipe-area');

    fireEvent.touchStart(area, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 80, clientY: 100 }] });

    expect(screen.getByTestId('index').textContent).toBe('0');
  });

  it('ignores vertical swipes', () => {
    render(<SwipeTestComponent total={3} />);
    const area = screen.getByTestId('swipe-area');

    fireEvent.touchStart(area, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 100, clientY: 300 }] });

    expect(screen.getByTestId('index').textContent).toBe('0');
  });
});
