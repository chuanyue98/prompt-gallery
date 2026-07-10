import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { useMediaNavigation } from '@/lib/hooks/useMediaNavigation';

function TestComponent({ total, onIndexChange }: { total: number; onIndexChange?: (index: number) => void }) {
  const { index, setIndex, next, prev } = useMediaNavigation(total);

  React.useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  return (
    <div>
      <span data-testid="index">{index}</span>
      <button data-testid="next" onClick={next}>Next</button>
      <button data-testid="prev" onClick={prev}>Prev</button>
      <button data-testid="set-first" onClick={() => setIndex(0)}>Set 0</button>
    </div>
  );
}

describe('useMediaNavigation', () => {
  it('navigates forward and backward', () => {
    const onIndexChange = vi.fn();
    render(<TestComponent total={3} onIndexChange={onIndexChange} />);

    const next = screen.getByTestId('next');
    const prev = screen.getByTestId('prev');
    const index = screen.getByTestId('index');

    expect(index.textContent).toBe('0');

    fireEvent.click(next);
    expect(index.textContent).toBe('1');

    fireEvent.click(next);
    expect(index.textContent).toBe('2');

    fireEvent.click(next);
    expect(index.textContent).toBe('0');

    fireEvent.click(prev);
    expect(index.textContent).toBe('2');
  });

  it('allows setting index directly', () => {
    render(<TestComponent total={5} />);

    fireEvent.click(screen.getByTestId('set-first'));
    expect(screen.getByTestId('index').textContent).toBe('0');
  });

  it('guards against total <= 0', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<TestComponent total={0} />);

    fireEvent.click(screen.getByTestId('next'));
    fireEvent.click(screen.getByTestId('prev'));

    expect(screen.getByTestId('index').textContent).toBe('0');
    consoleErrorSpy.mockRestore();
  });
});
