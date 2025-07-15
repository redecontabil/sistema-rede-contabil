import { ReactNode } from 'react';

export interface MenuItem {
  icon: ReactNode;
  label: string;
  path: string;
}

export interface SidebarProps {
  className?: string;
  onThemeChange?: (isDark: boolean) => void;
  onLogout?: () => void;
  defaultCollapsed?: boolean;
  defaultDarkMode?: boolean;
}

export interface SidebarState {
  isCollapsed: boolean;
  isDarkMode: boolean;
} 