import type { Metadata } from 'next';
import ThemeScript from '@/components/layout/ThemeScript';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prompt Gallery',
  description: 'A curated prompt gallery with switchable visual themes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="cream-warm"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="theme-body min-h-full flex flex-col">
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
