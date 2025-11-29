// components/navbarItems.ts
import { Home, Plus, Link2, History, MessageSquare, User, LucideIcon } from 'lucide-react';

export interface NavbarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string | number;
}

export const navbarItems: NavbarItem[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    icon: Home,
    href: '/dashboard'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    href: '/chat'
  },
  {
    id: 'crear-reunion',
    label: 'Crear Reunión',
    icon: Plus,
    href: '/crearReunion'
  },
  {
    id: 'unirse',
    label: 'Unirse a Reunión',
    icon: Link2,
    href: '/UnirseReu'
  },
  {
    id: 'historial',
    label: 'Historial de reuniones',
    icon: History,
    href: '/Historial'
  },
  
];

export default navbarItems;