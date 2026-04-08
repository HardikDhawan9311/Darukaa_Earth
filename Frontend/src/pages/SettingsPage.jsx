import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Globe, Palette, Database, ChevronRight, Check } from 'lucide-react';

const settingsSections = [
  {
    id: 'profile',
    icon: User,
    label: 'Profile',
    description: 'Manage your personal information',
    color: '#11ccf5',
  },
  {
    id: 'notifications',
    icon: Bell,
    label: 'Notifications',
    description: 'Configure alert preferences',
    color: '#a855f7',
  },
  {
    id: 'security',
    icon: Shield,
    label: 'Security',
    description: '2FA & access management',
    color: '#22c55e',
  },
  {
    id: 'regional',
    icon: Globe,
    label: 'Regional',
    description: 'Units, language, timezone',
    color: '#f59e0b',
  },
  {
    id: 'appearance',
    icon: Palette,
    label: 'Appearance',
    description: 'Theme and display options',
    color: '#ff3d5f',
  },
  {
    id: 'data',
    icon: Database,
    label: 'Data & API',
    description: 'API keys & integrations',
    color: '#06b6d4',
  },
];

const Toggle = ({ enabled, onToggle }) => (
  <button
    onClick={onToggle}
    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
      enabled ? 'bg-[#11ccf5]' : 'bg-gray-800'
    }`}
  >
    <div
      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
        enabled ? 'left-7' : 'left-1'
      }`}
    />
  </button>
);

const SettingsPage = () => {
  const [active, setActive] = useState('profile');
  const [notifications, setNotifications] = useState({ email: true, sms: false, push: true, reports: true });
  const [saved, setSaved] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Settings Nav */}
      <div className="w-64 flex-shrink-0 border-r border-white/5 p-4 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold px-3 mb-3">Preferences</p>
        {settingsSections.map(({ id, icon: Icon, label, description, color }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all text-left ${
              active === id
                ? 'bg-white/5 border border-white/10'
                : 'hover:bg-white/5'
            }`}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">{label}</p>
              <p className="text-[10px] text-gray-500 truncate">{description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-8" style={{ scrollbarWidth: 'none' }}>
        {active === 'profile' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-black text-white mb-2">Profile Settings</h2>
            <p className="text-gray-500 text-sm mb-8">Update your personal and contact information</p>

            {/* Avatar */}
            <div className="flex items-center space-x-5 mb-8 p-5 bg-[#05080a] border border-white/5 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-[#11ccf5] flex items-center justify-center text-black text-2xl font-black">
                {(user?.name || user?.email || 'A')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-black text-lg">{user?.name || user?.email || 'Admin User'}</p>
                <p className="text-gray-500 text-sm">{user?.email || 'admin@darukaa.earth'}</p>
                <p className="mt-1 px-2 py-0.5 bg-[#11ccf5]/20 text-[#11ccf5] text-[10px] font-black rounded-md uppercase tracking-wider inline-block">Admin</p>
              </div>
            </div>

            <div className="space-y-5">
              {[
                { label: 'Full Name', placeholder: user?.name || 'Hardik Dhawan', type: 'text' },
                { label: 'Email Address', placeholder: user?.email || 'admin@darukaa.earth', type: 'email' },
                { label: 'Organization', placeholder: 'Darukaa.Earth', type: 'text' },
                { label: 'Role', placeholder: 'Admin', type: 'text' },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">{field.label}</label>
                  <input
                    type={field.type}
                    defaultValue={field.placeholder}
                    className="w-full bg-[#05080a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#11ccf5]/50 transition-all"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {active === 'notifications' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-black text-white mb-2">Notifications</h2>
            <p className="text-gray-500 text-sm mb-8">Manage how you receive alerts and updates</p>

            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-5 bg-[#05080a] border border-white/5 rounded-2xl">
                  <div>
                    <p className="text-white font-bold capitalize">{key === 'sms' ? 'SMS Alerts' : key === 'push' ? 'Push Notifications' : key === 'reports' ? 'Weekly Reports' : 'Email Notifications'}</p>
                    <p className="text-gray-500 text-sm mt-0.5">Receive updates via {key}</p>
                  </div>
                  <Toggle enabled={value} onToggle={() => setNotifications(n => ({ ...n, [key]: !n[key] }))} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {active === 'security' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-2xl font-black text-white mb-2">Security</h2>
            <p className="text-gray-500 text-sm mb-8">Protect your account</p>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-[#05080a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#11ccf5]/50 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-[#05080a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#11ccf5]/50 transition-all" />
              </div>
              <div className="flex items-center justify-between p-5 bg-[#05080a] border border-white/5 rounded-2xl">
                <div>
                  <p className="text-white font-bold">Two-Factor Authentication</p>
                  <p className="text-gray-500 text-sm mt-0.5">Add an extra layer of security</p>
                </div>
                <Toggle enabled={false} onToggle={() => {}} />
              </div>
            </div>
          </motion.div>
        )}

        {(active === 'regional' || active === 'appearance' || active === 'data') && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <ChevronRight className="w-6 h-6 text-[#11ccf5]" />
            </div>
            <p className="text-white font-black text-xl mb-2 capitalize">{active} Settings</p>
            <p className="text-gray-500 text-sm">This section is coming soon.</p>
          </motion.div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex items-center space-x-3">
          <button
            onClick={handleSave}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-[#11ccf5] text-black hover:bg-[#11ccf5]/90 shadow-[0_4px_20px_rgba(17,204,245,0.3)]'
            }`}
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            <span>{saved ? 'Saved!' : 'Save Changes'}</span>
          </button>
          <button className="px-6 py-3 rounded-xl font-bold text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-all border border-white/5">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
