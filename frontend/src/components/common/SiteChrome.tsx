'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

/**
 * Wraps every route with the storefront Header/Footer, except /admin — which
 * has its own shell (sidebar nav) in app/admin/layout.tsx and must not get
 * the customer-facing chrome stacked on top of it.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
