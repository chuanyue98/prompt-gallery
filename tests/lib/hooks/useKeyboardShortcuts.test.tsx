import { renderHook, act, render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts';

function press(key: string, target: EventTarget = document, init: KeyboardEventInit = {}) {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
  });
}

describe('useKeyboardShortcuts', () => {
  it('fires the search shortcut on "/"', () => {
    const onSearchFocus = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSearchFocus }));

    press('/');

    expect(onSearchFocus).toHaveBeenCalledTimes(1);
  });

  it('fires the shortcuts panel toggle on "?"', () => {
    const onToggleShortcuts = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onToggleShortcuts }));

    press('?');

    expect(onToggleShortcuts).toHaveBeenCalledTimes(1);
  });

  it('fires onEscape on Escape', () => {
    const onEscape = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onEscape }));

    press('Escape');

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('does not fire "/" or "?" while typing in an input', () => {
    const onSearchFocus = vi.fn();
    const onToggleShortcuts = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSearchFocus, onToggleShortcuts }));

    const input = document.createElement('input');
    document.body.appendChild(input);
    press('/', input);
    press('?', input);

    expect(onSearchFocus).not.toHaveBeenCalled();
    expect(onToggleShortcuts).not.toHaveBeenCalled();
    input.remove();
  });

  it('still fires Escape while typing, so dialogs stay closable', () => {
    const onEscape = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onEscape }));

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    press('Escape', textarea);

    expect(onEscape).toHaveBeenCalledTimes(1);
    textarea.remove();
  });

  it('ignores shortcuts inside contentEditable regions', () => {
    const onSearchFocus = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSearchFocus }));

    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    Object.defineProperty(editable, 'isContentEditable', { value: true });
    document.body.appendChild(editable);
    press('/', editable);

    expect(onSearchFocus).not.toHaveBeenCalled();
    editable.remove();
  });

  it('ignores "/" combined with a modifier', () => {
    const onSearchFocus = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSearchFocus }));

    press('/', document, { metaKey: true });
    press('/', document, { ctrlKey: true });
    press('/', document, { altKey: true });

    expect(onSearchFocus).not.toHaveBeenCalled();
  });

  it('ignores "?" combined with a modifier', () => {
    const onToggleShortcuts = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onToggleShortcuts }));

    press('?', document, { ctrlKey: true });

    expect(onToggleShortcuts).not.toHaveBeenCalled();
  });

  it('does nothing when disabled', () => {
    const onSearchFocus = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSearchFocus }, false));

    press('/');

    expect(onSearchFocus).not.toHaveBeenCalled();
  });

  it('tolerates missing handlers', () => {
    renderHook(() => useKeyboardShortcuts({}));

    expect(() => {
      press('/');
      press('?');
      press('Escape');
    }).not.toThrow();
  });

  it('ignores unrelated keys', () => {
    const onSearchFocus = vi.fn();
    const onEscape = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSearchFocus, onEscape }));

    press('a');

    expect(onSearchFocus).not.toHaveBeenCalled();
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('does not rebind the listener when the handlers object changes identity', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const latest = vi.fn();

    function Harness() {
      const [n, setN] = useState(0);
      // 每次渲染都传新的对象字面量，模拟真实调用方。
      useKeyboardShortcuts({ onSearchFocus: () => latest(n) });
      return <button onClick={() => setN((v) => v + 1)}>bump</button>;
    }

    const { getByRole } = render(<Harness />);
    const initialBindings = addSpy.mock.calls.filter(([type]) => type === 'keydown').length;

    act(() => getByRole('button').click());
    act(() => getByRole('button').click());

    const finalBindings = addSpy.mock.calls.filter(([type]) => type === 'keydown').length;
    expect(finalBindings).toBe(initialBindings);

    // 但处理函数必须仍然读到最新的闭包值。
    press('/');
    expect(latest).toHaveBeenCalledWith(2);

    addSpy.mockRestore();
  });

  it('exposes a documented shortcut list', () => {
    expect(KEYBOARD_SHORTCUTS.length).toBeGreaterThan(0);
    for (const item of KEYBOARD_SHORTCUTS) {
      expect(item.keys).toBeTruthy();
      expect(item.description).toBeTruthy();
    }
  });
});
