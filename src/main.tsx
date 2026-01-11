import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './ErrorBoundary'

import { HelmetProvider } from 'react-helmet-async'

console.log('Main.tsx executing...');

// EMERGENCY STABILITY: Unregister any existing service workers to clear stale caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      console.log('Unregistering SW:', registration);
      registration.unregister();
    }
    // Optional: clear caches if needed, but SW unregister is usually enough to stop the "trap"
    // caches.keys().then(names => { ... }) 
  }).catch(err => console.error('SW Cleanup Error:', err));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)



