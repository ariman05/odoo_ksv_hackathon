import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, FileText, CheckSquare, 
  CreditCard, BarChart2, Activity, LogOut, Bell, Menu, X, ChevronLeft, User, Search
} from 'lucide-react';
import api from '../api.js';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unread, setUnread] = useState(true);

  // Fetch notifications (activities)
  const { data: activityData } = useQuery({
    queryKey: ['navbar-activities'],
    queryFn: async () => {
      const res = await api.get('/api/activity/');
      return res.data;
    },
    enabled: !!localStorage.getItem('token'),
    refetchInterval: 15000,
  });

  const notifications = activityData?.results || (Array.isArray(activityData) ? activityData : []);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'vendor'] },
    { name: 'Vendors', path: '/vendors', icon: Users, roles: ['admin', 'manager'] },
    { name: 'RFQs', path: '/rfqs', icon: FileText, roles: ['admin', 'manager', 'vendor'] },
    { name: 'Quotations', path: '/quotations', icon: CheckSquare, roles: ['admin', 'manager', 'vendor'] },
    { name: 'Approvals', path: '/approvals', icon: CheckSquare, roles: ['admin', 'manager', 'vendor'] },
    { name: 'POs & Invoices', path: '/purchase-orders', icon: CreditCard, roles: ['admin', 'manager', 'vendor'] },
    { name: 'Reports', path: '/reports', icon: BarChart2, roles: ['admin', 'manager'] },
    { name: 'Activity Log', path: '/activity', icon: Activity, roles: ['admin', 'manager'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role || 'vendor'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getPageTitle = () => {
    const active = menuItems.find(item => item.path === location.pathname);
    return active ? active.name : 'VendorBridge';
  };

  return (
    <div className="h-screen w-screen flex bg-[#030712] text-slate-100 font-sans overflow-hidden mesh-bg relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <motion.aside 
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col glass-panel border-r border-slate-800/60 transition-transform lg:translate-x-0
          ${mobileOpen ? 'translate-x-0 w-[256px]' : '-translate-x-full'} 
          lg:relative`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 shrink-0 bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold rounded-lg shadow-md shadow-brand-500/10">
              V
            </div>
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-display font-extrabold text-base bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent uppercase tracking-wider whitespace-nowrap"
              >
                VendorBridge
              </motion.span>
            )}
          </div>
          <button 
            onClick={() => setMobileOpen(false)} 
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-3.5 py-3 rounded-xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold' 
                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-100 border border-transparent'}`}
              >
                <Icon size={18} className={isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'} />
                {!collapsed && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs"
                  >
                    {item.name}
                  </motion.span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-950 border border-slate-800 text-[10px] uppercase font-bold tracking-widest text-white rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-2xl">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-800/40">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-950/40 border border-slate-800/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-brand-400 border border-slate-800 shrink-0">
                <User size={16} />
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                  </p>
                  <span className="inline-block text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/15">
                    {user.role}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/40 bg-[#030712]/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileOpen(true)} 
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="hidden lg:block text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} className={`transform transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>

            {/* Breadcrumb Info */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>VendorBridge</span>
              <span>/</span>
              <span className="text-slate-200 font-bold">{getPageTitle()}</span>
            </div>
          </div>

          {/* Top Navbar Actions */}
          <div className="flex items-center gap-3 relative">
            {/* Search shortcut simulation */}
            <div className="relative hidden md:block w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder="Search..."
                disabled
                className="w-full pl-8 pr-8 py-1.5 bg-slate-950/40 border border-slate-800/60 rounded-lg text-xs text-slate-400 cursor-not-allowed"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-[8px] text-slate-500 font-bold uppercase tracking-wider">Ctrl K</span>
            </div>

            {/* Notifications Button */}
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setUnread(false);
              }}
              className="relative p-2 text-slate-400 hover:text-white bg-slate-950/50 border border-slate-800/60 rounded-xl hover:bg-slate-900/50 transition-colors shadow-inner"
            >
              <Bell size={16} />
              {unread && notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-brand-500 rounded-full"></span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-50 w-80 glass-panel rounded-2xl border border-slate-800/80 shadow-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
                      <h4 className="font-display font-extrabold text-white text-[10px] uppercase tracking-wider">Recent Activity Notifications</h4>
                      {notifications.length > 0 && (
                        <span className="text-[8px] uppercase tracking-wider bg-brand-500/15 text-brand-400 px-2 py-0.5 rounded-full font-bold border border-brand-500/10">
                          {notifications.length} Total
                        </span>
                      )}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-6">No new notifications.</p>
                      ) : (
                        notifications.slice(0, 5).map((notif) => (
                          <div key={notif.id} className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-900/50 hover:bg-slate-950/70 transition-colors text-[10px] leading-normal space-y-1">
                            <div className="flex justify-between items-center gap-2">
                              <span className="font-bold text-brand-400 uppercase text-[8px] bg-brand-500/5 border border-brand-500/10 px-1.5 py-0.5 rounded">
                                {notif.action}
                              </span>
                              <span className="text-[8px] text-slate-500">
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-300">{notif.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Content Portal */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
