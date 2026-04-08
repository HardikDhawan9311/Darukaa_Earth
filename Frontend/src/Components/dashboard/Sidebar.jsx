import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Map as MapIcon,
  BarChart3,
  LogOut,
  Leaf,
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Projects',  icon: FolderKanban,   to: '/admin/projects'  },
  { label: 'Map',       icon: MapIcon,         to: '/admin/map'       },
  { label: 'Analytics', icon: BarChart3,       to: '/admin/analytics' },
];

const Sidebar = ({ onLogout }) => (
  <aside className="w-20 lg:w-64 bg-[#05080a] border-r border-white/5 flex flex-col py-8 z-50 flex-shrink-0">
    {/* Logo */}
    <div className="px-6 mb-12 flex items-center space-x-3 overflow-hidden">
      <div className="w-10 h-10 bg-[#11ccf5] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(17,204,245,0.3)] flex-shrink-0">
        <Leaf className="text-black w-6 h-6" />
      </div>
      <span className="text-white font-black text-xl tracking-tighter hidden lg:inline whitespace-nowrap">
        Darukaa<span className="text-[#11ccf5]">.Earth</span>
      </span>
    </div>

    {/* Nav */}
    <nav className="flex-1 px-4 space-y-2">
      {menuItems.map(({ label, icon: Icon, to }) => (
        <NavLink
          key={label}
          to={to}
          className={({ isActive }) =>
            `w-full flex items-center p-3 rounded-xl transition-all group border-l-4 ${
              isActive
                ? 'bg-gradient-to-r from-[#11ccf5]/20 to-transparent text-[#11ccf5] border-[#11ccf5]'
                : 'text-gray-500 hover:bg-white/5 hover:text-white border-transparent'
            }`
          }
        >
          <Icon className="w-6 h-6 flex-shrink-0" />
          <span className="ml-4 font-bold hidden lg:inline">{label}</span>
        </NavLink>
      ))}
    </nav>

    {/* Logout */}
    <div className="px-4 mt-auto">
      <button
        onClick={onLogout}
        className="w-full flex items-center p-3 text-gray-600 hover:text-[#ff3d5f] hover:bg-[#ff3d5f]/5 rounded-xl transition-all border-l-4 border-transparent"
      >
        <LogOut className="w-6 h-6 flex-shrink-0" />
        <span className="ml-4 font-bold hidden lg:inline">Logout</span>
      </button>
    </div>
  </aside>
);

export default Sidebar;
