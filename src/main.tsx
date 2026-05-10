import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import './lib/i18n';
import App from './App';

async function enableMocks() {
  if (!import.meta.env.DEV) return;
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

void enableMocks().then(() => {
  const root = document.getElementById('root');
  if (!root) throw new Error('#root missing');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
