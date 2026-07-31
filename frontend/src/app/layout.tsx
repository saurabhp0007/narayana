import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './providers';
import DataPreloader from '@/components/common/DataPreloader';
import EmailUsButton from '@/components/common/EmailUsButton';

export const metadata: Metadata = {
  title: 'Narayana eCommerce',
  description: 'Your one-stop shop for quality products',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <DataPreloader />
          {children}
          <EmailUsButton />
        </AuthProvider>
      </body>
    </html>
  );
}
