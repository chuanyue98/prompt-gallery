import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ShortcutsPanel } from '@/components/ui/ShortcutsPanel';
import { KEYBOARD_SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts';

describe('ShortcutsPanel', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ShortcutsPanel isOpen={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders every documented shortcut, grouped by scope', () => {
    render(<ShortcutsPanel isOpen onClose={() => {}} />);

    for (const item of KEYBOARD_SHORTCUTS) {
      expect(screen.getByText(item.description)).toBeInTheDocument();
    }

    const scopes = new Set(KEYBOARD_SHORTCUTS.map((s) => s.scope || '全局'));
    for (const scope of scopes) {
      expect(screen.getByText(scope)).toBeInTheDocument();
    }
  });

  it('is exposed as a modal dialog', () => {
    render(<ShortcutsPanel isOpen onClose={() => {}} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', '键盘快捷键');
  });

  it('moves focus to the close button when opened', () => {
    render(<ShortcutsPanel isOpen onClose={() => {}} />);

    expect(screen.getByRole('button', { name: '关闭快捷键面板' })).toHaveFocus();
  });

  it('restores focus to the previously focused element on close', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(<ShortcutsPanel isOpen onClose={() => {}} />);
    expect(trigger).not.toHaveFocus();

    rerender(<ShortcutsPanel isOpen={false} onClose={() => {}} />);
    expect(trigger).toHaveFocus();

    trigger.remove();
  });

  it('closes via the close button', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ShortcutsPanel isOpen onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: '关闭快捷键面板' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ShortcutsPanel isOpen onClose={onClose} />);

    await user.click(screen.getByRole('dialog'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when the panel body is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ShortcutsPanel isOpen onClose={onClose} />);

    await user.click(screen.getByText('键盘快捷键'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<ShortcutsPanel isOpen onClose={onClose} />);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores other keys', () => {
    const onClose = vi.fn();
    render(<ShortcutsPanel isOpen onClose={onClose} />);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('stops listening for Escape once closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(<ShortcutsPanel isOpen onClose={onClose} />);
    rerender(<ShortcutsPanel isOpen={false} onClose={onClose} />);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
