import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ErrorPage from '@/app/error';

describe('app/error boundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the failure message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorPage error={new Error('boom')} reset={() => {}} />);

    expect(screen.getByText('页面加载异常')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新加载' })).toBeInTheDocument();
  });

  it('logs the error once on mount', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('boom');

    render(<ErrorPage error={error} reset={() => {}} />);

    expect(consoleError).toHaveBeenCalledWith('Application error:', error);
  });

  it('calls reset when the retry button is clicked', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reset = vi.fn();
    const user = userEvent.setup();

    render(<ErrorPage error={new Error('boom')} reset={reset} />);
    await user.click(screen.getByRole('button', { name: '重新加载' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('accepts an error carrying a digest', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });

    render(<ErrorPage error={error} reset={() => {}} />);

    expect(screen.getByText('页面加载异常')).toBeInTheDocument();
  });
});
