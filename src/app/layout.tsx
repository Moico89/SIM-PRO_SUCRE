import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistema de Gobernanza Tarifaria Sucre v3.3 — GAM Sucre & Ecotraffic',
  description: 'Dashboard Web en Tiempo Real con Autenticación Multi-Rol y Auditoría Inmutable para la Concertación Tarifaria del Transporte Público',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
