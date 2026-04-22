import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Navbar from '@/components/layout/Navbar';
import { THEME_STORAGE_KEY } from '@/lib/theme';

describe('Navbar component', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = 'cyber-obsidian';
  });

  it('toggles theme dropdown and closes on outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <Navbar />
      </div>
    );

    const trigger = screen.getByTestId('theme-trigger');
    
    // 1. 打开下拉菜单
    await user.click(trigger);
    expect(screen.getByTestId('theme-options')).toBeInTheDocument();

    // 2. 点击外部
    fireEvent.mouseDown(screen.getByTestId('outside'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('theme-options')).not.toBeInTheDocument();
    });
  });

  it('updates theme internally and persists to localStorage', async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByTestId('theme-trigger'));
    
    const softUiOption = screen.getByTestId('theme-options').querySelector('[data-theme-option="soft-ui"]') as HTMLElement;
    await user.click(softUiOption);

    expect(document.documentElement.dataset.theme).toBe('soft-ui');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('soft-ui');
    
    await waitFor(() => {
      expect(screen.queryByTestId('theme-options')).not.toBeInTheDocument();
    });
  });

  it('scrolls to top when logo is clicked', async () => {
    const user = userEvent.setup();
    const mockScroll = vi.fn();
    vi.stubGlobal('scrollTo', mockScroll);
    
    render(<Navbar />);
    
    const logo = screen.getByText('Prompt Gallery');
    await user.click(logo);
    
    expect(mockScroll).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    
    vi.unstubAllGlobals();
  });
});
