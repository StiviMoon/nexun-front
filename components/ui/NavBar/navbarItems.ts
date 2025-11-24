import { Home, Plus, Link2, History, MessageSquare, User, LucideIcon } from 'lucide-react';

/**
 * NavbarItem
 * ----------
 * Represents a single item in the sidebar navigation.
 */
export interface NavbarItem {
  /** Unique identifier for the navbar item */
  id: string;
  /** Display label for the item */
  label: string;
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Path to navigate to when the item is clicked */
  href: string;
  /** Optional badge (text or number) to display alongside the item */
  badge?: string | number;
}

/**
 * navbarItems
 * -----------
 * Array of sidebar navigation items used in the AsideNavbar component.
 */
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
