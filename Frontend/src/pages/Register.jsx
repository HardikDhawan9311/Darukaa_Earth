import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, ShieldCheck, Leaf, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Welcome ${formData.fullName} to Darukaa Earth!`, {
          duration: 5000,
          icon: '🎉',
        });
        setFormData({ fullName: '', email: '', password: '', confirmPassword: '', role: 'user' });
      } else {
        toast.error(data.detail || 'Registration failed');
      }
    } catch (error) {
      toast.error('Could not connect to the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000306] p-6 font-sans">
      {/* Background Decorative Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#11ccf5]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ff3d5f]/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/10 p-10 relative z-10 transition-all hover:border-white/20">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#11ccf5] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(17,204,245,0.3)] mx-auto mb-6">
             <Leaf className="text-black w-10 h-10" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter mb-2">
            Create <span className="text-[#11ccf5]">Account</span>
          </h2>
          <p className="text-gray-500 text-sm font-medium tracking-wide border-t border-white/5 pt-4 inline-block uppercase">Join Darukaa Earth</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="relative group">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#11ccf5] w-5 h-5 transition-colors" />
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#11ccf5]/50 focus:bg-white/[0.07] transition-all"
              required
            />
          </div>

          {/* Email */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#11ccf5] w-5 h-5 transition-colors" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#11ccf5]/50 focus:bg-white/[0.07] transition-all"
              required
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#11ccf5] w-5 h-5 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Access Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-[#11ccf5]/50 focus:bg-white/[0.07] transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#11ccf5] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#11ccf5] w-5 h-5 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Access Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#11ccf5]/50 focus:bg-white/[0.07] transition-all"
              required
            />
          </div>

          {/* Role Selection */}
          <div className="relative group">
            <ShieldCheck className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#11ccf5] w-5 h-5 transition-colors" />
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-10 text-white focus:outline-none focus:border-[#11ccf5]/50 appearance-none cursor-pointer focus:bg-white/[0.07] transition-all"
              required
            >
              <option value="user" className="bg-[#0c0e14]">Standard User</option>
              <option value="admin" className="bg-[#0c0e14]">System Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#11ccf5] py-4 rounded-2xl font-black text-black shadow-[0_0_30px_rgba(17,204,245,0.2)] hover:shadow-[0_0_40px_rgba(17,204,245,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all transform mt-6 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center justify-center space-x-2">
              <span>{loading ? 'INITIALIZING...' : 'CREATE ACCOUNT'}</span>
              {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </div>
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-xs font-bold tracking-[2px] uppercase mb-4">Already have access?</p>
          <Link to="/login" className="text-[#11ccf5] hover:text-white font-black text-sm tracking-tight transition-all border-b border-[#11ccf5]/20 hover:border-[#11ccf5]">
            AUTHORIZE LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
