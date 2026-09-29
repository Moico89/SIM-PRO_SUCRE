'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registrado exitosamente con scope:', registration.scope);
          })
          .catch((error: unknown) => {
            console.warn('[PWA] Error al registrar Service Worker:', error);
          });
      });
    }
  }, []);

  return null;
}
