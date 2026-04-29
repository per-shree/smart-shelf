import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopMetrics from './TopMetrics';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-[var(--color-background-base)]">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:pl-64">
        <TopMetrics />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
