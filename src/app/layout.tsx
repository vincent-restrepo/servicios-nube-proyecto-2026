import type { Metadata } from 'next';
import './globals.css';
import { Providers } from "./providers";
import AppShell from '../components/AppShell';

const getCompanyName = () => process.env.COMPANY_NAME || 'Intranet corporativa';

export function generateMetadata(): Metadata {
  const companyName = process.env.COMPANY_NAME;
  return {
    title: companyName ? `${companyName} · Intranet` : 'Intranet corporativa',
    description: 'Portal interno para los empleados',
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <AppShell companyName={getCompanyName()}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

// La intranet lee las variables de entorno en cada petición (nunca se cachea).
export const dynamic = 'force-dynamic';
