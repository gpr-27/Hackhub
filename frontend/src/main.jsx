import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import './config'; // validates required VITE_* env vars at startup (fail fast)
import './index.css';
import App from './App';

// <ClerkProvider> reads VITE_CLERK_PUBLISHABLE_KEY from the environment itself
// (we never pass it as a prop). afterSignOutUrl sends users home on sign-out.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>
);
