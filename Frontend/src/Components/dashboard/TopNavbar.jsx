import React from 'react';
import { Search, User } from 'lucide-react';

const TopNavbar = ({ user }) => {
  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#000306]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2 w-full max-w-md group focus-within:border-[#11ccf5]/50 transition-all">
        <Search className="w-5 h-5 text-gray-500 group-hover:text-[#11ccf5]" />
        <input 
          type="text" 
          placeholder="Search geographical assets..." 
          className="bg-transparent border-none outline-none px-4 text-sm w-full text-white placeholder-gray-600"
        />
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4 pl-4 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white uppercase tracking-tight">{user?.fullName}</p>
            <p className="text-xs text-gray-500 capitalize font-mono leading-none">{user?.role}</p>
          </div>
          <div className="w-10 h-10 bg-[#11ccf5]/10 border border-[#11ccf5]/30 rounded-xl flex items-center justify-center">
            <User className="text-[#11ccf5] w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
