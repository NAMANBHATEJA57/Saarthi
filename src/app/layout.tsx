import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/shared/AppShell';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-[hsl(var(--canvas))] text-[hsl(var(--ink))] antialiased`}>
        {/* In the future, a ThemeProvider would wrap AppShell here */}
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
