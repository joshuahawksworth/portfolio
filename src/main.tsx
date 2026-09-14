import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';
import App from './App.tsx';
import './index.css';
import './theme/platform.css';

// Vercel Web Analytics: page views and visitors only, no cookies or personal data. Vite does
// not get the script injected automatically, so it is added here; a no-op in local dev.
inject();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
