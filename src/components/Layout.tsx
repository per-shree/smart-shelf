import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopMetrics from './TopMetrics';
import { Menu, X, Refrigerator } from 'lucide-react';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-[var(--color-background-base)]">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out lg:static lg:block`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pt-2 lg:pt-0">
        <header className="lg:hidden flex items-center justify-between px-6 py-3 bg-[var(--color-card-bg)]/80 backdrop-blur-md border border-[var(--color-border-subtle)] sticky top-4 mx-4 mb-4 z-30 rounded-full shadow-xl">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all active:scale-95"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white shadow-sm">
                <Refrigerator size={18} />
              </div>
              <span className="font-display font-bold text-lg text-[var(--color-primary)] tracking-tight">Smart Shelf</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="w-10 h-10 rounded-full border border-[var(--color-border-subtle)] overflow-hidden bg-[var(--color-background-base)] flex items-center justify-center text-[var(--color-primary)]"
          >
            <div className="w-full h-full bg-[var(--color-primary)]/10 flex items-center justify-center">
              <span className="text-xs font-black">SS</span>
            </div>
          </button>
        </header>

        <TopMetrics />
        <main ref={mainRef} className="flex-1 p-4 lg:p-8 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
