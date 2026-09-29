import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Tarify OS — Plataforma de Gobernanza & Regulación Tarifaria SaaS (GAMS & Ecotraffic)',
  description: 'Sistema Operativo de Gobernanza Tarifaria, Modelación del Costo de Operación Vehicular (COV) y Auditoría Inmutable para Gobiernos Municipales.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tarify OS',
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

