'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, Menu, X } from 'lucide-react';
import { navbarItems } from './navbarItems';
import Image from 'next/image';
import { useAuthWithQuery } from '@/hooks/useAuthWithQuery';

interface AsideNavbarProps {
  className?: string;
}

const AsideNavbar: React.FC<AsideNavbarProps> = ({ className = '' }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('navbar-collapsed');
      return saved === 'true';
    }
    return false;
  });
  const { currentUser, signOutUser, isSignOutLoading, isLogoutPending } = useAuthWithQuery();

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevenir scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Persistir estado en localStorage cuando cambia
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('navbar-collapsed', String(isCollapsed));
    }
  }, [isCollapsed]);

  const isActive = (href: string) => pathname === href;
  const userName = currentUser?.displayName || currentUser?.email || 'Mi perfil';
  const userAvatar = currentUser?.photoURL;

  const handleSignOut = async () => {
    try {
      await signOutUser();
      router.push('/inicio');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Contenido compartido del menú
  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Navigation Items */}
      <div className={`flex-1 py-4 space-y-1 ${!isMobile && isCollapsed ? 'px-2' : 'px-3'}`}>
        {navbarItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hovered = hoveredItem === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              onMouseEnter={() => !isMobile && setHoveredItem(item.id)}
              onMouseLeave={() => !isMobile && setHoveredItem(null)}
              onClick={() => isMobile && setIsMobileMenuOpen(false)}
              title={!isMobile && isCollapsed ? item.label : undefined}
              className={`
                relative flex items-center rounded-lg
                transition-all duration-200 group
                ${!isMobile && isCollapsed ? 'justify-center px-3 py-3' : 'gap-3 px-3 py-2.5'}
                ${active 
                  ? 'bg-cyan-500/10 text-cyan-400' 
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800/50'
                }
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-950
              `}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-purple-600 rounded-r-full" />
              )}
              <Icon className={`transition-transform flex-shrink-0 w-5 h-5 ${hovered ? 'scale-110' : ''}`} />
              <span 
                className={`
                  text-sm font-medium whitespace-nowrap
                  transition-all duration-300 ease-in-out
                  ${!isMobile && isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 ml-2'}
                `}
              >
                {item.label}
              </span>
              {item.badge && (isMobile || !isCollapsed) && (
                <span className="ml-auto bg-cyan-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {!active && hovered && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gray-600 rounded-r-full transition-all" />
              )}
              {!isMobile && isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-zinc-700">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile Section */}
      <div className={`p-3 border-t border-zinc-800 ${!isMobile && isCollapsed ? 'px-2' : ''}`}>
        <Link
          href="/perfil"
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
          title={!isMobile && isCollapsed ? userName : undefined}
          className={`
            relative flex items-center rounded-lg bg-zinc-800 hover:bg-zinc-700 
            transition-all group border border-zinc-700
            ${!isMobile && isCollapsed ? 'justify-center px-3 py-3' : 'gap-3 px-3 py-2.5'}
          `}
        >
          {userAvatar ? (
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-zinc-700/50 hover:ring-cyan-500/50 transition-all flex-shrink-0">
              <Image src={userAvatar} alt={userName} width={40} height={40} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center ring-2 ring-zinc-700/50 hover:ring-cyan-500/50 transition-all flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
          {(isMobile || !isCollapsed) && (
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors block truncate">{userName}</span>
              <span className="text-xs text-gray-500 block truncate">{currentUser?.email || ''}</span>
            </div>
          )}
          {!isMobile && isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-zinc-700">
              {userName}
            </div>
          )}
        </Link>

        <button
          onClick={handleSignOut}
          disabled={isSignOutLoading || isLogoutPending}
          title={!isMobile && isCollapsed ? 'Cerrar sesión' : undefined}
          className={`
            relative flex items-center rounded-lg transition-all duration-200 group mt-2 w-full
            ${!isMobile && isCollapsed ? 'justify-center px-3 py-3' : 'gap-3 px-3 py-2.5'}
            text-gray-400 hover:text-red-400 hover:bg-red-500/10
            border border-zinc-700 hover:border-red-500/30
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <LogOut className="transition-transform flex-shrink-0 w-5 h-5" />
          <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${!isMobile && isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 ml-2'}`}>
            {isSignOutLoading || isLogoutPending ? 'Cerrando...' : 'Cerrar sesión'}
          </span>
          {!isMobile && isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-zinc-700">
              Cerrar sesión
            </div>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-zinc-800 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between safe-area-inset-top">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Image 
            src="/LOGO_SOLO.svg" 
            alt="Nexun Logo" 
            width={32} 
            height={32} 
            className="w-8 h-8" 
            priority 
          />
          <span className="text-lg font-bold text-white">NEXUN</span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-purple-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" aria-hidden="true" />
          ) : (
            <Menu className="w-6 h-6" aria-hidden="true" />
          )}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Menu */}
      <aside
        id="mobile-menu"
        className={`
          lg:hidden fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 z-50
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          safe-area-inset-left
        `}
        aria-label="Menú de navegación"
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Mobile Menu Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between safe-area-inset-top">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3" 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Ir al dashboard"
          >
            <Image src="/LOGO_SOLO.svg" alt="Nexun Logo" width={40} height={40} className="w-10 h-10" priority />
            <span className="text-xl font-bold text-white">NEXUN</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <NavContent isMobile={true} />
      </aside>

      {/* Desktop Aside */}
      <aside 
        className={`
          hidden lg:flex relative bg-zinc-950 border-r border-zinc-800 flex-col
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${className}
        `}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-zinc-800 relative">
          <Link href="/dashboard" className="flex items-center gap-3 group transition-opacity" title={isCollapsed ? 'NEXUN' : undefined}>
            <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-105 flex-shrink-0">
              <Image src="/LOGO_SOLO.svg" alt="Nexun Logo" width={48} height={48} className="w-12 h-12" priority />
            </div>
            <span className={`text-xl font-bold text-white whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              NEXUN
            </span>
          </Link>
        </div>
        <NavContent isMobile={false} />
      </aside>

      {/* Spacer removed — layout now adds top padding to avoid overlap */}
    </>
  );
};

export default AsideNavbar;