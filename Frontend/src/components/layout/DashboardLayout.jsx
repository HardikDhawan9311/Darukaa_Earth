import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';
import TopNavbar from '../dashboard/TopNavbar';

const DashboardLayout = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading || !user) {
    return (
      <div className="h-screen w-full bg-[#000306] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#11ccf5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#000306] text-gray-300 font-sans">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 flex flex-col h-full min-h-0">
        <TopNavbar user={user} />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
