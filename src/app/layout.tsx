import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Saarthi',
  description: 'Your personal digital workspace',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#191919' },
    { media: '(prefers-color-scheme: light)', color: '#191919' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen text-[hsl(var(--ink))] antialiased bg-[hsl(var(--surface))]`}>
        {/* In the future, a ThemeProvider would wrap children here */}
        {children}
      </body>
    </html>
  );
}
