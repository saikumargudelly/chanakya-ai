import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// Add error handlers and cleanup
const handleStyleError = (e: ErrorEvent) => {
  if (e.target instanceof HTMLLinkElement) {
    console.warn('Style loading failed, falling back to inline styles');
  }
};

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  // Prevent FedCM abort errors from showing in console
  if (event.reason?.message?.includes('FedCM') || 
      event.reason?.message?.includes('aborted')) {
    event.preventDefault();
    return;
  }
  console.error('Unhandled rejection:', event.reason);
};

// Add event listeners
window.addEventListener('error', handleStyleError);
window.addEventListener('unhandledrejection', handleUnhandledRejection);

// Clean up on page unload
window.addEventListener('unload', () => {
  window.google?.accounts?.id?.cancel();
  window.removeEventListener('error', handleStyleError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
});

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
