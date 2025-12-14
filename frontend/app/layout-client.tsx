'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import darkCyanTheme from '@/lib/themes/darkCyan';

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={darkCyanTheme}>
      <CssBaseline />
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
