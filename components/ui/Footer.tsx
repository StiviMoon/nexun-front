import React from 'react';
import Link from 'next/link';
import { Mail, Globe, Github, Linkedin, Facebook, Instagram, Twitter } from 'lucide-react';
import Image from 'next/image';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const navigationLinks = [
    { href: '/sobre-nosotros', label: 'Sobre nosotros' },
    { href: '/explorar', label: 'Explorar' },
    { href: '/mi-cuenta', label: 'Mi cuenta' }
  ];

  const legalLinks = [
    { href: '/politicas-privacidad', label: 'Políticas de privacidad' },
    { href: '/terminos-condiciones', label: 'Términos y condiciones' },
    { href: '/politica-cookies', label: 'Política de cookies' }
  ];

  const socialLinks = [
    { href: 'https://github.com', icon: Github, label: 'GitHub' },
    { href: 'https://linkedin.com', icon: Linkedin, label: 'LinkedIn' },
    { href: 'https://facebook.com', icon: Facebook, label: 'Facebook' },
    { href: 'https://instagram.com', icon: Instagram, label: 'Instagram' },
    { href: 'https://twitter.com', icon: Twitter, label: 'X / Twitter' }
  ];

  return (
    <footer className={`bg-background text-white py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Container with border */}
        <div className="border-2 border-cyan-500/30 rounded-3xl p-8 md:p-12 shadow-lg shadow-cyan-500/10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-6 relative">
            <div className="flex items-center gap-3">
                <div className="w-20 h-20 flex items-center justify-center rounded-lg bg-transparent">
                    <Image
                    src="/LOGO_SOLO.svg"
                    alt="Nexun Logo" 
                    width={80}
                    height={80}
                    className="w-20 h-20"
                    priority
                    />
                </div>
                <span className="text-2xl font-bold">NEXUN</span>
            </div>
            
            {/* Vertical separator line */}
            <div className="hidden lg:block absolute right-1 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-400/50 via-purple-500/50 to-transparent"></div>
            
            <p className="text-gray-400 text-sm leading-relaxed pr-0 lg:pr-8">
              Su solución todo en uno para reuniones seguras. Desde la pequeña startup hasta la gran 
              empresa, garantizamos videollamadas fluidas, persistentes y protegidas, optimizadas 
              para el trabajo híbrido.
            </p>
            
            <div className="space-y-3">
              <a 
                href="mailto:contacto@nexun.com" 
                className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                <span>contacto@nexun.com</span>
              </a>
              <a 
                href="https://www.nexun.vercel.app" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                <Globe className="w-4 h-4" />
                <span>www.nexun.vercel.app</span>
              </a>
            </div>
          </div>
          {/* Separador horizontal solo en mobile/tablet */}
          <div className="block lg:hidden my-6 h-px w-full bg-gradient-to-r from-cyan-400/50 via-purple-500/50 to-transparent"></div>

          {/* Navigation Section */}
          <div className="relative flex flex-col items-start pl-9 pt-15">
            <h3 className="text-lg font-semibold  pl-[13px] mb-7">Navegación</h3>
            {/* Vertical separator line */}
            <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-400/50 via-purple-500/50 to-transparent"></div>
            <ul className="space-y-3 w-full">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-4 bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Separador horizontal solo en mobile/tablet */}
          <div className="block lg:hidden my-6 h-px w-full bg-gradient-to-r from-cyan-400/50 via-purple-500/50 to-transparent"></div>

          {/* Legal Section */}
          <div className="relative flex flex-col items-start pl-5 pt-15">
            <h3 className="text-lg font-semibold mb-6 pl-13">Legal</h3>
            {/* Vertical separator line */}
            <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-400/50 via-purple-500/50 to-transparent"></div>
            <ul className="space-y-3 w-full">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-4 bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Separador horizontal solo en mobile/tablet */}
          <div className="block lg:hidden my-6 h-px w-full bg-gradient-to-r from-cyan-400/50 via-purple-500/50 to-transparent"></div>

          {/* Social Section */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-center pt-[55px]">Síguenos</h3>
            <ul className="space-y-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <li key={social.href}>
                    <a 
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-3 group"
                    >
                      <Icon className="w-5 h-5" />
                      <span>{social.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Nexun. Todos los derechos reservados.
          </p>
        </div>
        
        </div>
      </div>
    </footer>
  );
};

export default Footer;