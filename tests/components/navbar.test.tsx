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
    
    // 使用正则匹配，因为文字被拆分到了嵌套 span 中
    const logo = screen.getByText(/Prompt/i);
    await user.click(logo);
    
    expect(mockScroll).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    
    vi.unstubAllGlobals();
  });

  it('renders responsive classes for mobile adaptation', () => {
    render(<Navbar />);
    
    // 检查投稿按钮的精简类
    const contributeBtn = screen.getByRole('button', { name: /\+/ });
    expect(contributeBtn.querySelector('.hidden.sm\\:inline')).toHaveTextContent('我要投稿');
    
    // 检查 Logo 文字的精简类
    const logoText = screen.getByText('Prompt');
    expect(logoText.querySelector('.hidden.xs\\:inline')).toHaveTextContent('Gallery');
    
    // 检查主题标签的精简类
    const themeTrigger = screen.getByTestId('theme-trigger');
    expect(themeTrigger.querySelector('.hidden.sm\\:block')).toHaveTextContent('THEME');
  });
});
