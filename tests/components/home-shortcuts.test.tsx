import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from '@/app/page';

function press(key: string) {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });
}

function getSearchBox() {
  return document.querySelector(
    'input[type="search"], input[placeholder*="搜索"], input[placeholder*="Search"]'
  ) as HTMLInputElement;
}

describe('Home keyboard shortcut wiring', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    }));
  });

  it('focuses the search box on "/"', async () => {
    render(<Home />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    press('/');

    expect(getSearchBox()).toHaveFocus();
  });

  it('opens and closes the shortcuts panel with "?"', async () => {
    render(<Home />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    press('?');
    expect(screen.getByRole('dialog', { name: '键盘快捷键' })).toBeInTheDocument();

    press('?');
    expect(screen.queryByRole('dialog', { name: '键盘快捷键' })).not.toBeInTheDocument();
  });

  it('does not steal focus out of the shortcuts panel when "/" is pressed', async () => {
    render(<Home />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    press('?');
    const closeButton = screen.getByRole('button', { name: '关闭快捷键面板' });
    expect(closeButton).toHaveFocus();

    press('/');

    // 面板的 focus trap 正锁着焦点，"/" 不该把焦点拽去搜索框。
    expect(getSearchBox()).not.toHaveFocus();
    expect(closeButton).toHaveFocus();
    expect(screen.getByRole('dialog', { name: '键盘快捷键' })).toBeInTheDocument();
  });

  it('opens the shortcuts panel from the navbar button', async () => {
    render(<Home />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const trigger = screen.getByRole('button', { name: /快捷键/ });
    act(() => trigger.click());

    expect(screen.getByRole('dialog', { name: '键盘快捷键' })).toBeInTheDocument();
  });
});
