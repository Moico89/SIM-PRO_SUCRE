import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Sistema de Gobernanza Tarifaria Sucre v3.3 — GAM Sucre & Ecotraffic',
  description: 'Dashboard Web en Tiempo Real con Autenticación Multi-Rol y Auditoría Inmutable para la Concertación Tarifaria del Transporte Público',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SIM-PRO Tarifa',
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-50 antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}

