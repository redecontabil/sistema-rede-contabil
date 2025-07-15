import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Bell,
  Search,
  HelpCircle
} from 'lucide-react';
import { SidebarProps, MenuItem } from './types';
import './Sidebar.css';

export function Sidebar({
  className = '',
  onThemeChange,
  onLogout,
  defaultCollapsed = false,
  defaultDarkMode = false
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isDarkMode, setIsDarkMode] = useState(defaultDarkMode);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { icon: <LayoutDashboard size={24} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FileText size={24} />, label: 'Documentos', path: '/documentos' },
    { icon: <Users size={24} />, label: 'Clientes', path: '/clientes' },
    { icon: <BarChart size={24} />, label: 'Relatórios', path: '/relatorios' },
    { icon: <Settings size={24} />, label: 'Configurações', path: '/configuracoes' },
  ];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    onThemeChange?.(newDarkMode);
  };

  const handleLogout = () => {
    onLogout?.();
  };

  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside
      className={`
        sidebar sidebar-enter
        ${className}
        fixed left-0 top-0 z-40 h-screen
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
        flex flex-col
      `}
    >
      {/* Logo e Toggle */}
      <div className="logo-container p-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-xl">RC</span>
            </div>
            <span className="text-xl font-semibold text-white">Rede Contábil</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
        >
          {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>

      {/* Barra de Pesquisa */}
      {!isCollapsed && (
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                focus:outline-none focus:ring-2 focus:ring-purple-500
                text-sm transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={index}
              to={item.path}
              className={`
                menu-item
                flex items-center gap-4 p-3
                transition-all duration-200
                ${isCollapsed ? 'justify-center' : ''}
                ${isActive ? 'active' : ''}
              `}
            >
              <div className={`menu-icon ${isActive ? 'text-purple-600 dark:text-purple-400' : ''}`}>
                {item.icon}
              </div>
              {!isCollapsed && (
                <span className={`${isActive ? 'font-medium' : ''}`}>
                  {item.label}
                </span>
              )}
              {isCollapsed && (
                <div className="menu-tooltip">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 space-y-2">
        {!isCollapsed && (
          <div className="flex items-center gap-4 p-3 rounded-lg bg-purple-50 dark:bg-gray-800/50 mb-4">
            <Bell size={20} className="text-purple-600 dark:text-purple-400" />
            <div className="flex-1">
              <p className="text-sm font-medium">Notificações</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">3 não lidas</p>
            </div>
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="action-button theme-toggle w-full flex items-center gap-4 p-3"
        >
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          {!isCollapsed && <span>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </button>
        
        <button
          onClick={handleLogout}
          className="action-button logout-button w-full flex items-center gap-4 p-3"
        >
          <LogOut size={24} />
          {!isCollapsed && <span>Sair</span>}
        </button>

        {!isCollapsed && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button className="w-full flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
              <HelpCircle size={18} />
              <span>Ajuda & Suporte</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
} 