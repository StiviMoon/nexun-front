
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { navbarItems } from './navbarItems';
import Image from 'next/image';
interface NavbarProps {
  userName?: string;
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ userName = 'Mi perfil', className = '' }) => {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (href: string) => pathname === href;

  return (
    <nav className={`bg-zinc-950 border border-zinc-800 rounded-2xl h-full flex flex-col ${className}`}>
      {/* Logo Section */}
      <div className="p-6 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-20 h-20 g flex items-center justify-center transition-transform group-hover:scale-105">
            <Image
              src="/LOGO_SOLO.svg" 
              alt="Nexun Logo"
              width={80}
              height={80}
              className="w-20 h-20"
              priority
            />
          </div>
          <span className="text-xl font-bold text-white">NEXUN</span>
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-6 px-4 space-y-2">
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
              className={`
                relative flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200 group
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
                className={`w-5 h-5 transition-transform ${
                  hovered ? 'scale-110' : ''
                }`} 
              />

              {/* Label */}
              <span className="text-sm font-medium">{item.label}</span>

              {/* Badge (optional) */}
              {item.badge && (
                <span className="ml-auto bg-cyan-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}

              {/* Hover effect line */}
              {!active && hovered && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gray-600 rounded-r-full transition-all" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-zinc-800">
        <Link
          href="/perfil"
          className="flex items-center gap-3 px-4 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-all group border border-zinc-700"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
            {userName}
          </span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;