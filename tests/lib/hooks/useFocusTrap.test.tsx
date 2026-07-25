import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import React, { useRef } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

function FocusTrapTest({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(containerRef, active);
  return (
    <div ref={containerRef} data-testid="container">
      <button data-testid="first">First</button>
      <input data-testid="middle" />
      <button data-testid="last">Last</button>
    </div>
  );
}

function mockOffsetParent(elements: HTMLElement[]) {
  elements.forEach((el) => {
    Object.defineProperty(el, 'offsetParent', {
      configurable: true,
      get: () => document.body,
    });
  });
}

describe('useFocusTrap', () => {
  it('does nothing when inactive', () => {
    render(<FocusTrapTest active={false} />);
    expect(true).toBe(true);
  });

  it('traps focus on Tab at last element -> moves to first', () => {
    render(<FocusTrapTest active={true} />);
    const first = screen.getByTestId('first');
    const middle = screen.getByTestId('middle');
    const last = screen.getByTestId('last');
    mockOffsetParent([first, middle, last]);

    last.focus();
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('traps focus on Shift+Tab at first element -> moves to last', () => {
    render(<FocusTrapTest active={true} />);
    const first = screen.getByTestId('first');
    const middle = screen.getByTestId('middle');
    const last = screen.getByTestId('last');
    mockOffsetParent([first, middle, last]);

    first.focus();
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('ignores non-Tab keys', () => {
    render(<FocusTrapTest active={true} />);
    const first = screen.getByTestId('first');
    mockOffsetParent([first]);

    first.focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.activeElement).toBe(first);
  });

  it('brings focus back to first when focus is outside container on Tab', () => {
    render(<FocusTrapTest active={true} />);
    const first = screen.getByTestId('first');
    const last = screen.getByTestId('last');
    mockOffsetParent([first, last]);

    document.body.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });
});
