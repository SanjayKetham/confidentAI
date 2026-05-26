/* ── Layout — Tailwind ───────────────────────────────────────── */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      <main
        className="flex-1 overflow-auto transition-all duration-300"
        style={{ marginLeft: collapsed ? 72 : 240, background: 'var(--bg-base)' }}
      >
        <div className="p-6 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

