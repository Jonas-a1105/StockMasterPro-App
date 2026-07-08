import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import styles from './DashboardLayout.module.css';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

export type SidebarMode = 'hidden' | 'compact' | 'full';

export function DashboardLayout() {
  const isMobile = useIsMobile();
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(isMobile ? 'hidden' : 'compact');

  const toggleSidebar = useCallback(() => {
    setSidebarMode(prev => {
      if (isMobile) {
        if (prev === 'hidden') return 'compact';
        if (prev === 'compact') return 'full';
        return 'hidden';
      }
      return prev === 'compact' ? 'full' : 'compact';
    });
  }, [isMobile]);

  useLayoutEffect(() => {
    const w = isMobile ? '0px'
      : sidebarMode === 'full' ? '260px'
      : '60px';
    document.documentElement.style.setProperty('--sidebar-w', w);
  }, [sidebarMode, isMobile]);

  return (
    <div className={styles.container}>
      <Sidebar mode={sidebarMode} onClose={() => setSidebarMode('hidden')} isMobile={isMobile} />
      <main className={styles.main}>
        <Navbar onToggleSidebar={toggleSidebar} />
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
