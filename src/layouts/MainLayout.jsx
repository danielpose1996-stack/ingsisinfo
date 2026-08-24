import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RoleSimulationBanner from '../components/RoleSimulationBanner';
import { useAuth } from '../context/AuthContext';

export default function MainLayout({ children }) {
  const location = useLocation();
  const { isSimulating } = useAuth();
  const isHtmlPlayer = location.pathname.startsWith('/ova-html');

  if (isHtmlPlayer) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col selection:bg-[var(--selection-bg)] selection:text-[var(--selection-text)]">
        <RoleSimulationBanner />
        <main className={`flex-1 w-full h-full relative ${isSimulating ? 'pt-12' : ''}`}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-[var(--selection-bg)] selection:text-[var(--selection-text)]">
      <Navbar />
      <RoleSimulationBanner />
      <main className={`flex-grow ${isSimulating ? 'pt-36' : 'pt-24'}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
