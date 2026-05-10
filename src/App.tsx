import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Router } from '@/router';
import { bootPreferences } from '@/lib/preferences';
import { bootMaintenanceFromUrl } from '@/lib/maintenanceState';

bootPreferences();
bootMaintenanceFromUrl();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="unipay-theme">
        <HashRouter>
          <Router />
          <Toaster richColors position="top-right" />
        </HashRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
