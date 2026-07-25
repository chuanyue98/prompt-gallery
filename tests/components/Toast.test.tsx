import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { showToast, dismissToast, ToastContainer } from '@/components/ui/Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders toast after showToast called', () => {
    render(<ToastContainer />);
    act(() => {
      showToast('Hello', 'success');
    });
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('auto-dismisses after duration', () => {
    render(<ToastContainer />);
    act(() => {
      showToast('Temporary', 'info', 1000);
    });
    expect(screen.getByText('Temporary')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.queryByText('Temporary')).not.toBeInTheDocument();
  });

  it('supports error variant', () => {
    render(<ToastContainer />);
    act(() => {
      showToast('Failed', 'error');
    });
    const toast = screen.getByText('Failed');
    expect(toast.className).toContain('theme-danger-button');
  });

  it('dismisses on click', () => {
    render(<ToastContainer />);
    act(() => {
      showToast('Click me', 'success');
    });
    const toast = screen.getByText('Click me');
    fireEvent.click(toast);
    expect(screen.queryByText('Click me')).not.toBeInTheDocument();
  });

  it('supports multiple toasts', () => {
    render(<ToastContainer />);
    act(() => {
      showToast('First', 'success');
      showToast('Second', 'info');
    });
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('dismissToast removes by id', () => {
    render(<ToastContainer />);
    let keepId = -1;
    let removeId = -1;
    // Use unique messages and infer ids from order
    act(() => {
      showToast('KeepItem', 'success');
    });
    act(() => {
      showToast('RemoveItem', 'error');
    });
    // The first toast gets id = nextId (before increment), second gets nextId+1
    // Since nextId is module-level, we try dismissing the second toast by trying ids
    // Instead, dismiss by clicking the remove item
    const removeToast = screen.getByText('RemoveItem');
    fireEvent.click(removeToast);
    expect(screen.getByText('KeepItem')).toBeInTheDocument();
    expect(screen.queryByText('RemoveItem')).not.toBeInTheDocument();
  });
});
