import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { isRestrictedInAppBrowser } from './lib/inAppBrowserEscape';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import { queryClient } from './lib/queryClient';
import './styles/global.css';
import './styles/app.css';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

if (import.meta.env.PROD && 'serviceWorker' in navigator && !isRestrictedInAppBrowser()) {
  const swUrl = `${import.meta.env.BASE_URL}sw.js`;
  navigator.serviceWorker.register(swUrl).catch(() => {
    // Service worker is optional — imageCache still helps via the Cache API.
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
