import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ThemeScript from '@/components/layout/ThemeScript';

describe('ThemeScript component', () => {
  it('renders a script tag with inner HTML', () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector('script');
    expect(script).toBeInTheDocument();
    expect(script?.innerHTML).toContain('window.localStorage.getItem');
  });
});
