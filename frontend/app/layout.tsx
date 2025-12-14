import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Roboto_Mono } from 'next/font/google';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import darkCyanTheme from '@/lib/themes/darkCyan';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  weight: ['300', '400', '500'],
});

export const metadata: Metadata = {
  title: 'TRON Lock System - Admin Dashboard',
  description: 'Admin dashboard for TRON USDT lock program',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0A1A1F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${robotoMono.variable}`}>
      <body className={inter.className}>
        <ThemeProvider theme={darkCyanTheme}>
          <CssBaseline />
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}