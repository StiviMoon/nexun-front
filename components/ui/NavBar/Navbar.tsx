
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
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
  // Inicializar estado desde localStorage usando función lazy
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('navbar-collapsed');
      return saved === 'true';
    }
    return false;
  });
  const { currentUser, signOutUser, isSignOutLoading, isLogoutPending } = useAuthWithQuery();

  // Persistir estado en localStorage cuando cambia
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('navbar-collapsed', String(isCollapsed));
    }
  }, [isCollapsed]);

  const isActive = (href: string) => pathname === href;
  const userName = currentUser?.displayName || currentUser?.email || 'Mi perfil';
  const userAvatar = currentUser?.photoURL;

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <aside 
      className={`
        relative bg-zinc-950 border-r border-zinc-800 flex flex-col
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${className}
      `}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-zinc-800 relative">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 group transition-opacity"
          title={isCollapsed ? 'NEXUN' : undefined}
        >
          <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-105 flex-shrink-0">
            <Image
              src="/LOGO_SOLO.svg" 
              alt="Nexun Logo"
              width={48}
              height={48}
              className="w-12 h-12"
              priority
            />
          </div>
          <span 
            className={`
              text-xl font-bold text-white whitespace-nowrap
              transition-all duration-300 ease-in-out
              ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
            `}
          >
            NEXUN
          </span>
        </Link>
        
        {/* Toggle Button */}
        <button
          onClick={toggleCollapse}
          className={`
            absolute -right-3 top-1/2 -translate-y-1/2
            w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700
            flex items-center justify-center
            hover:bg-zinc-700 hover:border-zinc-600
            transition-all duration-200 z-10
            shadow-lg
          `}
          aria-label={isCollapsed ? 'Expandir navegación' : 'Colapsar navegación'}
          title={isCollapsed ? 'Expandir navegación' : 'Colapsar navegación'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <div className={`flex-1 py-4 space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {navbarItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hovered = hoveredItem === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => {
                // Asegurar que el navbar permanezca colapsado al navegar
                // El estado isCollapsed NO se modifica al hacer clic
                // La navegación funciona normalmente sin expandir el navbar
              }}
              title={isCollapsed ? item.label : undefined}
              className={`
                relative flex items-center rounded-lg
                transition-all duration-200 group
                ${isCollapsed ? 'justify-center px-3 py-3' : 'gap-3 px-3 py-2.5'}
                ${active 
                  ? 'bg-cyan-500/10 text-cyan-400' 
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800/50'
                }
              `}
            >
              {/* Active indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-purple-600 rounded-r-full" />
              )}

              {/* Icon */}
              <Icon 
                className={`
                  transition-transform flex-shrink-0
                  ${isCollapsed ? 'w-5 h-5' : 'w-5 h-5'}
                  ${hovered ? 'scale-110' : ''}
                `} 
              />

              {/* Label */}
              <span 
                className={`
                  text-sm font-medium whitespace-nowrap
                  transition-all duration-300 ease-in-out
                  ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 ml-2'}
                `}
              >
                {item.label}
              </span>

              {/* Badge (optional) */}
              {item.badge && !isCollapsed && (
                <span className="ml-auto bg-cyan-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}

              {/* Hover effect line */}
              {!active && hovered && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gray-600 rounded-r-full transition-all" />
              )}

              {/* Tooltip cuando está colapsado */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-zinc-700">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile Section */}
      <div className={`p-3 border-t border-zinc-800 ${isCollapsed ? 'px-2' : ''}`}>
        <Link
          href="/dashboard"
          onClick={() => {
            // Asegurar que el navbar permanezca colapsado al navegar
            // El estado isCollapsed NO se modifica al hacer clic
            // La navegación funciona normalmente sin expandir el navbar
          }}
          title={isCollapsed ? userName : undefined}
          className={`
            relative flex items-center rounded-lg bg-zinc-800 hover:bg-zinc-700 
            transition-all group border border-zinc-700
            ${isCollapsed ? 'justify-center px-3 py-3' : 'gap-3 px-3 py-2.5'}
          `}
        >
          {userAvatar ? (
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-zinc-700/50 hover:ring-cyan-500/50 transition-all flex-shrink-0">
              <Image
                src={userAvatar}
                alt={userName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center ring-2 ring-zinc-700/50 hover:ring-cyan-500/50 transition-all flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors block truncate">
                {userName}
              </span>
              <span className="text-xs text-gray-500 block truncate">
                {currentUser?.email || ''}
              </span>
            </div>
          )}
          {/* Tooltip cuando está colapsado */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-zinc-700">
              {userName}
            </div>
          )}
        </Link>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          disabled={isSignOutLoading || isLogoutPending}
          title={isCollapsed ? 'Cerrar sesión' : undefined}
          className={`
            relative flex items-center rounded-lg
            transition-all duration-200 group
            mt-2 w-full
            ${isCollapsed ? 'justify-center px-3 py-3' : 'gap-3 px-3 py-2.5'}
            text-gray-400 hover:text-red-400 hover:bg-red-500/10
            border border-zinc-700 hover:border-red-500/30
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <LogOut 
            className={`
              transition-transform flex-shrink-0
              w-5 h-5
              ${hoveredItem === 'signout' ? 'scale-110' : ''}
            `} 
          />
          
          <span 
            className={`
              text-sm font-medium whitespace-nowrap
              transition-all duration-300 ease-in-out
              ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 ml-2'}
            `}
          >
            {isSignOutLoading || isLogoutPending ? 'Cerrando...' : 'Cerrar sesión'}
          </span>

          {/* Tooltip cuando está colapsado */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-zinc-700">
              Cerrar sesión
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AsideNavbar;