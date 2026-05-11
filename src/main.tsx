import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import './lib/i18n';
import App from './App';

// Teach JSON.stringify how to serialize BigInt as a JSON number. Money.amount uses
// bigint for minor-unit precision (tiyins/cents), and MSW handlers respond with
// HttpResponse.json which goes through JSON.stringify. UZS tiyins max out far below
// Number.MAX_SAFE_INTEGER (9e15), so collapsing bigint -> number on the wire is safe
// and lets formatMoney pick up the resulting number form transparently (it already
// handles both bigint and number).
(BigInt.prototype as unknown as { toJSON: (this: bigint) => number }).toJSON = function (
  this: bigint,
) {
  return Number(this);
};

async function enableMocks() {
  const { worker } = await import('./mocks/browser');
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledRequest: 'bypass',
  });
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
