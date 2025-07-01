import React from 'react';
import { createRoot } from 'react-dom/client';
import './lib/firebase'; // Import Firebase configuration first
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" />
  </React.StrictMode>
);
