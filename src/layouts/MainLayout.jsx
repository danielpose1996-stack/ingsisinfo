import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MainLayout({ children }) {
  const location = useLocation();
  const isHtmlPlayer = location.pathname.startsWith('/ova-html');

  if (isHtmlPlayer) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col selection:bg-[var(--selection-bg)] selection:text-[var(--selection-text)]">
        <main className="flex-1 w-full h-full relative">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-[var(--selection-bg)] selection:text-[var(--selection-text)]">
      <Navbar />
      <main className="flex-grow pt-24">
        {children}
      </main>
      <Footer />
    </div>
  );
}
